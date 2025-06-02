// BlekkPro Optimized Facial Recognition Module for Next.js
// This module uses TensorFlow.js with the lightweight MediaPipe FaceMesh model
// Optimized for performance and minimal resource usage

import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

class BlekkProFacialRecognition {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.isInitializing = false;
    this.detectorConfig = {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      refineLandmarks: false, // Set to true only when needed for detailed lip/eye analysis
      maxFaces: 1 // Optimize for single face detection
    };
    
    // Key facial landmarks for PMU applications
    this.keyLandmarks = {
      browLeft: [336, 296, 334, 293, 300, 276, 283, 282, 295, 285],
      browRight: [107, 66, 105, 63, 70, 46, 53, 52, 65, 55],
      lipOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
      lipInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
      faceContour: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
    };
    
    // Symmetry reference points
    this.symmetryPoints = {
      midForehead: 151,
      noseTip: 1,
      midChin: 199,
      leftEyeCenter: 468,
      rightEyeCenter: 473
    };
  }

  /**
   * Initialize the facial recognition model
   * Uses progressive loading to minimize initial load time
   */
  async initialize() {
    if (this.isModelLoaded || this.isInitializing) {
      return this.isModelLoaded;
    }
    
    this.isInitializing = true;
    
    try {
      // Dynamically load TensorFlow.js backend based on device capability
      const tf = await import('@tensorflow/tfjs');
      
      // Check if WebGL is available for acceleration
      const webGLAvailable = await tf.backend().getGPGPUContext ? true : false;
      
      if (webGLAvailable) {
        await tf.setBackend('webgl');
        // Optimize WebGL for lower precision but faster computation
        await tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
        await tf.env().set('WEBGL_PACK', true);
        console.log('Using WebGL backend for acceleration');
      } else {
        await tf.setBackend('cpu');
        console.log('Using CPU backend');
      }
      
      // Load the lightweight model
      this.model = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        this.detectorConfig
      );
      
      this.isModelLoaded = true;
      this.isInitializing = false;
      
      return true;
    } catch (error) {
      console.error('Error initializing facial recognition:', error);
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Detect facial landmarks in an image
   * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input - Input image or video
   * @returns {Promise<Object>} - Detected facial landmarks and analysis
   */
  async detectFace(input) {
    if (!this.isModelLoaded) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Model initialization failed' };
      }
    }
    
    try {
      // Perform detection with optimized settings
      const faces = await this.model.estimateFaces(input, {
        flipHorizontal: false,
        staticImageMode: true // Set to false for video for better performance
      });
      
      if (faces && faces.length > 0) {
        const face = faces[0]; // Use first face
        
        // Extract and organize landmarks for PMU applications
        const landmarks = this.extractPMULandmarks(face);
        
        // Calculate symmetry score
        const symmetryScore = this.calculateSymmetryScore(landmarks);
        
        return {
          success: true,
          landmarks,
          symmetryScore,
          boundingBox: face.boundingBox,
          faceDetected: true
        };
      } else {
        return {
          success: true,
          faceDetected: false
        };
      }
    } catch (error) {
      console.error('Error detecting face:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract relevant landmarks for PMU applications
   * @param {Object} face - Face detection result
   * @returns {Object} - Organized landmarks
   */
  extractPMULandmarks(face) {
    const keypoints = face.keypoints;
    const landmarks = {};
    
    // Extract key landmark groups
    for (const [group, indices] of Object.entries(this.keyLandmarks)) {
      landmarks[group] = indices.map(index => {
        const point = keypoints[index];
        return point ? { x: point.x, y: point.y, z: point.z || 0 } : null;
      }).filter(point => point !== null);
    }
    
    // Extract symmetry reference points
    landmarks.symmetryReferences = {};
    for (const [name, index] of Object.entries(this.symmetryPoints)) {
      const point = keypoints[index];
      if (point) {
        landmarks.symmetryReferences[name] = { x: point.x, y: point.y, z: point.z || 0 };
      }
    }
    
    return landmarks;
  }

  /**
   * Calculate symmetry score based on facial landmarks
   * @param {Object} landmarks - Extracted landmarks
   * @returns {Number} - Symmetry score (0-100)
   */
  calculateSymmetryScore(landmarks) {
    try {
      // Simple implementation for performance
      // Calculate midline based on symmetry reference points
      const refs = landmarks.symmetryReferences;
      if (!refs.midForehead || !refs.noseTip || !refs.midChin) {
        return 80; // Default fallback value
      }
      
      // Calculate midline
      const midline = {
        x1: refs.midForehead.x,
        y1: refs.midForehead.y,
        x2: refs.midChin.x,
        y2: refs.midChin.y
      };
      
      // Calculate symmetry score based on distance of paired landmarks from midline
      let totalDeviation = 0;
      let pointCount = 0;
      
      // Compare left and right brow positions
      if (landmarks.browLeft.length > 0 && landmarks.browRight.length > 0) {
        const leftBrowCenter = this.calculateCentroid(landmarks.browLeft);
        const rightBrowCenter = this.calculateCentroid(landmarks.browRight);
        
        const leftDist = this.distanceToLine(leftBrowCenter, midline);
        const rightDist = this.distanceToLine(rightBrowCenter, midline);
        
        totalDeviation += Math.abs(leftDist - rightDist);
        pointCount++;
      }
      
      // Calculate lip symmetry
      if (landmarks.lipOuter.length > 0) {
        const lipCenter = this.calculateCentroid(landmarks.lipOuter);
        const lipDeviation = this.distanceToLine(lipCenter, midline);
        
        totalDeviation += lipDeviation;
        pointCount++;
      }
      
      if (pointCount === 0) return 80; // Default fallback
      
      // Calculate average deviation and convert to score
      const avgDeviation = totalDeviation / pointCount;
      const maxDeviation = 20; // Maximum expected deviation in pixels
      
      // Convert deviation to score (0-100)
      const score = Math.max(0, Math.min(100, 100 - (avgDeviation / maxDeviation * 100)));
      
      return Math.round(score);
    } catch (error) {
      console.error('Error calculating symmetry score:', error);
      return 80; // Default fallback value
    }
  }

  /**
   * Calculate centroid of a set of points
   * @param {Array} points - Array of {x,y} points
   * @returns {Object} - Centroid {x,y}
   */
  calculateCentroid(points) {
    const sum = points.reduce((acc, point) => {
      return { x: acc.x + point.x, y: acc.y + point.y };
    }, { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  /**
   * Calculate distance from point to line
   * @param {Object} point - Point {x,y}
   * @param {Object} line - Line {x1,y1,x2,y2}
   * @returns {Number} - Distance
   */
  distanceToLine(point, line) {
    const { x, y } = point;
    const { x1, y1, x2, y2 } = line;
    
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Generate symmetry guide overlay for canvas
   * @param {Object} landmarks - Facial landmarks
   * @param {HTMLCanvasElement} canvas - Target canvas
   * @returns {Boolean} - Success status
   */
  drawSymmetryGuide(landmarks, canvas) {
    if (!landmarks || !canvas) return false;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    try {
      const refs = landmarks.symmetryReferences;
      if (!refs.midForehead || !refs.midChin) return false;
      
      // Clear existing overlay
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw vertical midline
      ctx.beginPath();
      ctx.moveTo(refs.midForehead.x, refs.midForehead.y);
      ctx.lineTo(refs.midChin.x, refs.midChin.y);
      ctx.strokeStyle = 'rgba(0, 120, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw horizontal guides
      const drawHorizontalGuide = (y, dashPattern = [5, 5]) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = 'rgba(0, 120, 255, 0.5)';
        ctx.setLineDash(dashPattern);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      
      // Draw guides at key positions
      if (landmarks.browLeft.length > 0 && landmarks.browRight.length > 0) {
        const leftBrowCenter = this.calculateCentroid(landmarks.browLeft);
        const rightBrowCenter = this.calculateCentroid(landmarks.browRight);
        const browY = (leftBrowCenter.y + rightBrowCenter.y) / 2;
        drawHorizontalGuide(browY);
      }
      
      if (refs.noseTip) {
        drawHorizontalGuide(refs.noseTip.y);
      }
      
      if (landmarks.lipOuter.length > 0) {
        const lipCenter = this.calculateCentroid(landmarks.lipOuter);
        drawHorizontalGuide(lipCenter.y);
      }
      
      // Draw key landmarks
      const drawLandmarks = (points, color = 'rgba(0, 255, 0, 0.7)') => {
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        });
      };
      
      // Draw brow landmarks
      drawLandmarks(landmarks.browLeft, 'rgba(0, 255, 0, 0.7)');
      drawLandmarks(landmarks.browRight, 'rgba(0, 255, 0, 0.7)');
      
      // Draw lip landmarks
      drawLandmarks(landmarks.lipOuter, 'rgba(255, 0, 128, 0.7)');
      
      return true;
    } catch (error) {
      console.error('Error drawing symmetry guide:', error);
      return false;
    }
  }

  /**
   * Release resources when component unmounts
   */
  dispose() {
    if (this.model && this.model.dispose) {
      this.model.dispose();
    }
    this.isModelLoaded = false;
  }
}

export default BlekkProFacialRecognition;
