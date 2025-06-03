import React, { useEffect, useRef, useState } from 'react';
import BlekkProFacialRecognition from './BlekkProFacialRecognition';
import BlekkProPMUBrushes from './BlekkProPMUBrushes';

const BlekkProApp = () => {
  // References
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const facialRecognitionRef = useRef(null);
  const pmuBrushesRef = useRef(null);

  // State
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [symmetryScore, setSymmetryScore] = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const [currentBrush, setCurrentBrush] = useState(null);
  const [availableBrushes, setAvailableBrushes] = useState(null);
  const [subscription, setSubscription] = useState('free');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // Initialize modules
  useEffect(() => {
    // Create instances if they don't exist
    if (!facialRecognitionRef.current) {
      facialRecognitionRef.current = new BlekkProFacialRecognition();
    }

    if (!pmuBrushesRef.current) {
      pmuBrushesRef.current = new BlekkProPMUBrushes();
      pmuBrushesRef.current.setUserSubscription(subscription);
    }

    // Initialize facial recognition
    const initFacialRecognition = async () => {
      setIsModelLoaded(false);
      const initialized = await facialRecognitionRef.current.initialize();
      setIsModelLoaded(initialized);

      if (initialized) {
        console.log('Facial recognition initialized successfully');
      } else {
        console.error('Failed to initialize facial recognition');
      }
    };

    // Get available brushes
    const brushes = pmuBrushesRef.current.getAvailableBrushes();
    setAvailableBrushes(brushes);

    // Set default brush
    const result = pmuBrushesRef.current.selectBrush('basic', 'standardShader');
    if (result.success) {
      setCurrentBrush(result.brush);
    }

    // Initialize
    initFacialRecognition();

    // Cleanup on unmount
    return () => {
      if (facialRecognitionRef.current) {
        facialRecognitionRef.current.dispose();
      }
    };
  }, [subscription]);

  // Handle subscription change
  useEffect(() => {
    if (pmuBrushesRef.current) {
      pmuBrushesRef.current.setUserSubscription(subscription);

      // Update available brushes
      const brushes = pmuBrushesRef.current.getAvailableBrushes();
      setAvailableBrushes(brushes);
    }
  }, [subscription]);

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Set canvas dimensions
        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        if (!canvas || !overlayCanvas) return;

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        overlayCanvas.width = img.width;
        overlayCanvas.height = img.height;

        // Draw image to canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Process facial recognition
        processImage(canvas);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Process image for facial recognition
  const processImage = async (imageElement) => {
    if (!facialRecognitionRef.current || !isModelLoaded) {
      console.error('Facial recognition not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      // Detect face
      const result = await facialRecognitionRef.current.detectFace(imageElement);

      if (result.success) {
        setFaceDetected(result.faceDetected);

        if (result.faceDetected) {
          setLandmarks(result.landmarks);
          setSymmetryScore(result.symmetryScore);

          // Draw symmetry guide
          if (overlayCanvasRef.current) {
            facialRecognitionRef.current.drawSymmetryGuide(result.landmarks, overlayCanvasRef.current);
          }
        }
      } else {
        console.error('Error detecting face:', result.error);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle brush selection
  const handleBrushSelect = (category, brushId) => {
    if (!pmuBrushesRef.current) return;

    const result = pmuBrushesRef.current.selectBrush(category, brushId);

    if (result.success) {
      setCurrentBrush(result.brush);
    } else if (result.reason === 'subscription_required') {
      setUpgradePrompt(result.upgradePrompt);
      setShowUpgradePrompt(true);
    }
  };

  // Handle canvas mouse events for drawing
  const handleCanvasMouseDown = (e) => {
    if (!currentBrush) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    // Get canvas position
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Start drawing
    setIsDrawing(true);
    setCurrentStroke([{ x, y, pressure: 1 }]);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !currentBrush) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    // Get canvas position
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add point to stroke
    setCurrentStroke(prev => [...prev, { x, y, pressure: 1 }]);

    // Apply brush stroke
    if (pmuBrushesRef.current && currentStroke.length > 0) {
      const ctx = canvas.getContext('2d');
      pmuBrushesRef.current.applyBrushStroke(ctx, [currentStroke[currentStroke.length - 1], { x, y, pressure: 1 }], [121, 85, 61]);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Handle subscription upgrade
  const handleUpgrade = () => {
    setSubscription('pro');
    setShowUpgradePrompt(false);
  };

  // Render upgrade prompt
  const renderUpgradePrompt = () => {
    if (!showUpgradePrompt || !upgradePrompt) return null;

    return (
      <div className="upgrade-prompt">
        <h3>{upgradePrompt.title}</h3>
        <p>{upgradePrompt.message}</p>
        <ul>
          {upgradePrompt.benefits.map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
        <div className="upgrade-actions">
          <button onClick={handleUpgrade}>Upgrade Now</button>
          <button onClick={() => setShowUpgradePrompt(false)}>Maybe Later</button>
        </div>
      </div>
    );
  };

  // Render brush selector
  const renderBrushSelector = () => {
    if (!availableBrushes) return null;

    return (
      <div className="brush-selector">
        <h3>Basic Brushes</h3>
        <div className="brush-list">
          {Object.entries(availableBrushes.basic).map(([id, brush]) => (
            <div
              key={id}
              className={`brush-item ${currentBrush && currentBrush.name === brush.name ? 'active' : ''}`}
              onClick={() => handleBrushSelect('basic', id)}
            >
              {brush.name}
            </div>
          ))}
        </div>

        {availableBrushes.advanced && (
          <>
            <h3>Advanced Brushes</h3>
            <div className="brush-list">
              {Object.entries(availableBrushes.advanced).map(([id, brush]) => (
                <div
                  key={id}
                  className={`brush-item ${currentBrush && currentBrush.name === brush.name ? 'active' : ''}`}
                  onClick={() => handleBrushSelect('advanced', id)}
                >
                  {brush.name}
                </div>
              ))}
            </div>
          </>
        )}

        {availableBrushes.locked && (
          <>
            <h3>Pro Brushes (Locked)</h3>
            <div className="brush-list locked">
              {Object.entries(availableBrushes.locked).map(([id, brush]) => (
                <div
                  key={id}
                  className="brush-item locked"
                  onClick={() => handleBrushSelect('advanced', id)}
                >
                  {brush.name} 🔒
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="blekkpro-app">
      <h1>BlekkPro PMU Tools</h1>

      <div className="subscription-status">
        Current Plan: {subscription === 'pro' ? 'Pro' : 'Free'}
        {subscription !== 'pro' && (
          <button onClick={handleUpgrade}>Upgrade to Pro</button>
        )}
      </div>

      <div className="upload-section">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      <div className="status-section">
        <div>Model Loaded: {isModelLoaded ? 'Yes' : 'No'}</div>
        <div>Face Detected: {faceDetected ? 'Yes' : 'No'}</div>
        {faceDetected && <div>Symmetry Score: {symmetryScore}%</div>}
      </div>

      <div className="editor-container">
        {renderBrushSelector()}

        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width="800"
            height="600"
            className="main-canvas"
          />
          <canvas
            ref={overlayCanvasRef}
            width="800"
            height="600"
            className="overlay-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>
      </div>

      {renderUpgradePrompt()}

      <style jsx>{`
        .blekkpro-app {
          font-family: 'Arial', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }

        .subscription-status {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .subscription-status button {
          margin-left: 10px;
          background-color: #e83e8c;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }

        .upload-section {
          margin-bottom: 20px;
        }

        .status-section {
          margin-bottom: 20px;
          display: flex;
          gap: 20px;
        }

        .editor-container {
          display: flex;
          gap: 20px;
        }

        .brush-selector {
          width: 200px;
        }

        .brush-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 20px;
        }

        .brush-item {
          padding: 8px 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
          cursor: pointer;
        }

        .brush-item.active {
          background-color: #e83e8c;
          color: white;
        }

        .brush-item.locked {
          opacity: 0.7;
          background-color: #eee;
        }

        .canvas-container {
          position: relative;
          width: 800px;
          height: 600px;
        }

        .main-canvas {
          position: absolute;
          top: 0;
          left: 0;
          border: 1px solid #ddd;
          background-color: white;
        }

        .overlay-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: all;
        }

        .upgrade-prompt {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 400px;
          width: 100%;
          z-index: 1000;
        }

        .upgrade-prompt h3 {
          color: #e83e8c;
          margin-top: 0;
        }

        .upgrade-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .upgrade-actions button:first-child {
          background-color: #e83e8c;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .upgrade-actions button:last-child {
          background-color: transparent;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default BlekkProApp;
