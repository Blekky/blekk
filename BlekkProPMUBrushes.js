// BlekkPro Optimized PMU Brush Simulation Module for Next.js
// Lightweight implementation for optimal performance in resource-constrained environments

class BlekkProPMUBrushes {
  constructor() {
    this.currentBrush = null;
    this.brushPresets = {
      // Basic brushes (available in free tier)
      basic: {
        standardLiner: {
          name: "Standard Liner",
          type: "liner",
          size: 1,
          opacity: 0.9,
          spacing: 0.1,
          scatter: 0,
          pressureSensitivity: 0.7,
          subscription: "free"
        },
        standardShader: {
          name: "Standard Shader",
          type: "shader",
          size: 3,
          opacity: 0.8,
          spacing: 0.15,
          scatter: 0.1,
          pressureSensitivity: 0.8,
          subscription: "free"
        },
        powderBrow: {
          name: "Powder Brow",
          type: "shader",
          size: 5,
          opacity: 0.6,
          spacing: 0.2,
          scatter: 0.3,
          pressureSensitivity: 0.5,
          subscription: "free"
        }
      },
      // Advanced brushes (available in pro tier)
      advanced: {
        shader3RS: {
          name: "3RS Shader",
          type: "specialized",
          size: 3,
          opacity: 0.85,
          spacing: 0.12,
          scatter: 0.08,
          pressureSensitivity: 0.9,
          subscription: "pro"
        },
        ombreLipOutline: {
          name: "Ombre Lip Outline",
          type: "specialized",
          size: 2,
          opacity: 0.9,
          spacing: 0.05,
          scatter: 0.02,
          pressureSensitivity: 0.8,
          subscription: "pro"
        },
        microbladeNatural: {
          name: "Microblade Natural",
          type: "specialized",
          size: 1,
          opacity: 0.95,
          spacing: 0.02,
          scatter: 0.01,
          pressureSensitivity: 0.9,
          subscription: "pro"
        }
      }
    };
    
    this.userSubscription = 'free';
  }

  /**
   * Set user subscription level
   * @param {String} level - Subscription level ('free' or 'pro')
   */
  setUserSubscription(level) {
    if (level !== 'free' && level !== 'pro') {
      return false;
    }
    
    this.userSubscription = level;
    return true;
  }

  /**
   * Get available brushes based on subscription
   * @returns {Object} - Available brushes
   */
  getAvailableBrushes() {
    const result = {
      basic: { ...this.brushPresets.basic }
    };
    
    if (this.userSubscription === 'pro') {
      result.advanced = { ...this.brushPresets.advanced };
    } else {
      // For free users, show locked brushes
      result.locked = {};
      
      // Add preview of locked brushes
      Object.entries(this.brushPresets.advanced).forEach(([id, brush]) => {
        result.locked[id] = { ...brush };
      });
    }
    
    return result;
  }

  /**
   * Select a brush
   * @param {String} category - Brush category
   * @param {String} brushId - Brush identifier
   * @returns {Object} - Result with success status and brush or error
   */
  selectBrush(category, brushId) {
    // Check if category exists
    if (!this.brushPresets[category]) {
      return {
        success: false,
        reason: 'invalid_category',
        message: `Invalid brush category: ${category}`
      };
    }
    
    // Check if brush exists
    if (!this.brushPresets[category][brushId]) {
      return {
        success: false,
        reason: 'invalid_brush',
        message: `Invalid brush: ${brushId}`
      };
    }
    
    const brush = this.brushPresets[category][brushId];
    
    // Check subscription
    if (brush.subscription === 'pro' && this.userSubscription !== 'pro') {
      return {
        success: false,
        reason: 'subscription_required',
        message: 'This brush requires a Pro subscription',
        upgradePrompt: this.getUpgradePrompt(brushId)
      };
    }
    
    // Set current brush
    this.currentBrush = {
      ...brush,
      id: brushId,
      category
    };
    
    return {
      success: true,
      brush: this.currentBrush
    };
  }

  /**
   * Get current brush
   * @returns {Object|null} - Current brush or null
   */
  getCurrentBrush() {
    return this.currentBrush;
  }

  /**
   * Update current brush settings
   * @param {Object} settings - New settings
   * @returns {Boolean} - Success status
   */
  updateCurrentBrushSettings(settings) {
    if (!this.currentBrush) {
      return false;
    }
    
    // Update settings
    Object.entries(settings).forEach(([key, value]) => {
      if (key in this.currentBrush) {
        this.currentBrush[key] = value;
      }
    });
    
    return true;
  }

  /**
   * Check if feature is available with current subscription
   * @param {String} featureId - Feature identifier
   * @returns {Boolean} - Availability status
   */
  isFeatureAvailable(featureId) {
    // Define features and their required subscription levels
    const features = {
      'basic_brushes': 'free',
      'shader_brushes': 'free',
      'liner_brushes': 'free',
      'specialized_brushes': 'pro',
      'ombre_lip': 'pro',
      'microblade': 'pro',
      'powder_brow': 'free',
      'needle_configuration': 'pro',
      'export_high_res': 'pro'
    };
    
    // Check if feature exists
    if (!features[featureId]) {
      return false;
    }
    
    // Check subscription
    const requiredSubscription = features[featureId];
    
    if (requiredSubscription === 'free') {
      return true;
    }
    
    return this.userSubscription === 'pro';
  }

  /**
   * Get upgrade prompt for a feature
   * @param {String} featureId - Feature identifier
   * @returns {Object} - Upgrade prompt
   */
  getUpgradePrompt(featureId) {
    // Define feature-specific upgrade prompts
    const prompts = {
      'shader3RS': {
        title: 'Unlock 3RS Shader Brush',
        message: 'Upgrade to BlekkPro Pro to access professional 3RS shader brushes for perfect brow shading.',
        benefits: [
          'Realistic 3-needle round shader simulation',
          'Precise pigment distribution control',
          'Professional-grade results'
        ]
      },
      'ombreLipOutline': {
        title: 'Unlock Ombre Lip Outline Tool',
        message: 'Upgrade to BlekkPro Pro to access specialized ombre lip outline tools for perfect lip treatments.',
        benefits: [
          'Specialized lip outline brushes',
          'Gradient and feathering controls',
          'Realistic lip blush simulation'
        ]
      },
      'microbladeNatural': {
        title: 'Unlock Natural Microblade Tool',
        message: 'Upgrade to BlekkPro Pro to access natural microblade tools for realistic hair strokes.',
        benefits: [
          'Realistic hair stroke simulation',
          'Natural-looking results',
          'Advanced pressure sensitivity'
        ]
      },
      'export_high_res': {
        title: 'Unlock High-Resolution Export',
        message: 'Upgrade to BlekkPro Pro to export your designs in high resolution.',
        benefits: [
          'Professional-quality exports',
          'Print-ready resolution',
          'Lossless image quality'
        ]
      },
      'default': {
        title: 'Unlock Pro Features',
        message: 'Upgrade to BlekkPro Pro to access all professional features.',
        benefits: [
          'All specialized PMU brushes',
          'Advanced customization options',
          'High-resolution exports',
          'Priority support'
        ]
      }
    };
    
    // Return feature-specific prompt or default
    return prompts[featureId] || prompts.default;
  }

  /**
   * Apply brush stroke to canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} points - Array of points {x, y, pressure}
   * @param {Array} color - RGB color array [r, g, b]
   * @returns {Boolean} - Success status
   */
  applyBrushStroke(ctx, points, color) {
    if (!ctx || !points || points.length === 0 || !this.currentBrush) {
      return false;
    }
    
    try {
      // Save context state
      ctx.save();
      
      // Set composite operation
      ctx.globalCompositeOperation = 'source-over';
      
      // Convert color to string
      const colorStr = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
      
      // Get brush settings
      const { size, opacity, spacing, scatter, pressureSensitivity, type } = this.currentBrush;
      
      // Optimize for performance by using simplified brush rendering
      // This is a key optimization for Replit and resource-constrained environments
      switch (type) {
        case 'liner':
          this._applyLinerBrush(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity);
          break;
          
        case 'shader':
          this._applyShaderBrush(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity);
          break;
          
        case 'specialized':
          this._applySpecializedBrush(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity);
          break;
          
        default:
          this._applyDefaultBrush(ctx, points, colorStr, size, opacity);
          break;
      }
      
      // Restore context state
      ctx.restore();
      
      return true;
    } catch (error) {
      console.error('Error applying brush stroke:', error);
      return false;
    }
  }

  /**
   * Apply liner brush stroke (optimized)
   * @private
   */
  _applyLinerBrush(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity) {
    // For performance, use a simple path for liner brushes
    ctx.beginPath();
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;
    
    // Draw path
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const pressure = point.pressure || 1;
      
      // Apply pressure sensitivity
      const adjustedSize = size * (1 + (pressure - 0.5) * pressureSensitivity);
      ctx.lineWidth = adjustedSize;
      
      // Draw line segment
      ctx.lineTo(point.x, point.y);
    }
    
    ctx.stroke();
  }

  /**
   * Apply shader brush stroke (optimized)
   * @private
   */
  _applyShaderBrush(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity) {
    // For performance, use dots with varying opacity for shader brushes
    const minDistance = size * spacing;
    let lastX = points[0].x;
    let lastY = points[0].y;
    
    // Draw initial dot
    this._drawDot(ctx, lastX, lastY, size, colorStr, opacity);
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const pressure = point.pressure || 1;
      
      // Calculate distance
      const dx = point.x - lastX;
      const dy = point.y - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only draw if moved enough
      if (distance >= minDistance) {
        // Apply pressure sensitivity
        const adjustedSize = size * (1 + (pressure - 0.5) * pressureSensitivity);
        
        // Apply scatter
        const scatterX = (Math.random() - 0.5) * scatter * size * 2;
        const scatterY = (Math.random() - 0.5) * scatter * size * 2;
        
        // Draw dot
        this._drawDot(ctx, point.x + scatterX, point.y + scatterY, adjustedSize, colorStr, opacity * pressure);
        
        // Update last position
        lastX = point.x;
        lastY = point.y;
      }
    }
  }

  /**
   * Apply specialized brush stroke (optimized)
   * @private
   */
  _applySpecializedBrush(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity) {
    // For specialized brushes, use a combination of techniques based on brush ID
    const brushId = this.currentBrush.id;
    
    switch (brushId) {
      case 'shader3RS':
        // 3RS shader - use multiple offset dots for each point
        this._apply3RSShader(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity);
        break;
        
      case 'ombreLipOutline':
        // Ombre lip outline - use gradient-filled path
        this._applyOmbreLipOutline(ctx, points, colorStr, size, opacity, spacing, pressureSensitivity);
        break;
        
      case 'microbladeNatural':
        // Microblade natural - use tapered strokes
        this._applyMicrobladeNatural(ctx, points, colorStr, size, opacity, spacing, pressureSensitivity);
        break;
        
      default:
        // Fallback to shader brush
        this._applyShaderBrush(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity);
        break;
    }
  }

  /**
   * Apply 3RS shader brush stroke (optimized)
   * @private
   */
  _apply3RSShader(ctx, points, colorStr, size, opacity, spacing, scatter, pressureSensitivity) {
    // For performance, simulate 3 needle configuration with 3 offset dots
    const minDistance = size * spacing;
    let lastX = points[0].x;
    let lastY = points[0].y;
    
    // Draw initial dots
    this._drawTripleDot(ctx, lastX, lastY, size, colorStr, opacity);
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const pressure = point.pressure || 1;
      
      // Calculate distance
      const dx = point.x - lastX;
      const dy = point.y - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only draw if moved enough
      if (distance >= minDistance) {
        // Apply pressure sensitivity
        const adjustedSize = size * (1 + (pressure - 0.5) * pressureSensitivity);
        
        // Apply scatter
        const scatterX = (Math.random() - 0.5) * scatter * size;
        const scatterY = (Math.random() - 0.5) * scatter * size;
        
        // Draw triple dot
        this._drawTripleDot(ctx, point.x + scatterX, point.y + scatterY, adjustedSize, colorStr, opacity * pressure);
        
        // Update last position
        lastX = point.x;
        lastY = point.y;
      }
    }
  }

  /**
   * Apply ombre lip outline brush stroke (optimized)
   * @private
   */
  _applyOmbreLipOutline(ctx, points, colorStr, size, opacity, spacing, pressureSensitivity) {
    // For ombre lip outline, use a path with gradient
    if (points.length < 2) return;
    
    // Create color with varying opacity
    const baseColor = colorStr.replace('rgba(', '').replace(')', '').split(',');
    const r = baseColor[0];
    const g = baseColor[1];
    const b = baseColor[2];
    
    // Draw path
    ctx.beginPath();
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw with varying opacity
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const pressure = point.pressure || 1;
      
      // Apply pressure sensitivity
      const adjustedSize = size * (1 + (pressure - 0.5) * pressureSensitivity);
      ctx.lineWidth = adjustedSize;
      
      // Vary opacity based on position in stroke
      const progress = i / (points.length - 1);
      const adjustedOpacity = opacity * (1 - progress * 0.3) * pressure;
      
      ctx.globalAlpha = adjustedOpacity;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${adjustedOpacity})`;
      
      // Draw line segment
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      
      // Reset path to avoid connecting all points
      if (i < points.length - 1) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      }
    }
  }

  /**
   * Apply microblade natural brush stroke (optimized)
   * @private
   */
  _applyMicrobladeNatural(ctx, points, colorStr, size, opacity, spacing, pressureSensitivity) {
    // For microblade natural, use tapered strokes
    if (points.length < 2) return;
    
    // Draw tapered path
    ctx.beginPath();
    ctx.strokeStyle = colorStr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;
    
    // Calculate path length for tapering
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Draw with varying width
    let currentLength = 0;
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const prevPoint = points[i-1];
      const pressure = point.pressure || 1;
      
      // Calculate segment length
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      // Update current length
      currentLength += segmentLength;
      
      // Calculate taper factor (thinner at ends, thicker in middle)
      const progress = currentLength / totalLength;
      const taperFactor = 4 * progress * (1 - progress); // Parabolic function peaking at 0.5
      
      // Apply pressure sensitivity and tapering
      const adjustedSize = size * taperFactor * (1 + (pressure - 0.5) * pressureSensitivity);
      ctx.lineWidth = adjustedSize;
      
      // Draw line segment
      ctx.lineTo(point.x, point.y);
    }
    
    ctx.stroke();
  }

  /**
   * Apply default brush stroke (fallback)
   * @private
   */
  _applyDefaultBrush(ctx, points, colorStr, size, opacity) {
    // Simple fallback for unknown brush types
    ctx.beginPath();
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;
    
    // Draw path
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
  }

  /**
   * Draw a single dot
   * @private
   */
  _drawDot(ctx, x, y, size, color, alpha) {
    ctx.beginPath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw a triple dot (for 3RS shader)
   * @private
   */
  _drawTripleDot(ctx, x, y, size, color, alpha) {
    // Draw center dot
    this._drawDot(ctx, x, y, size, color, alpha);
    
    // Draw two satellite dots
    const offset = size * 0.6;
    const angle = Math.random() * Math.PI * 2; // Random angle
    
    const x1 = x + Math.cos(angle) * offset;
    const y1 = y + Math.sin(angle) * offset;
    this._drawDot(ctx, x1, y1, size * 0.8, color, alpha * 0.9);
    
    const x2 = x + Math.cos(angle + Math.PI * 2/3) * offset;
    const y2 = y + Math.sin(angle + Math.PI * 2/3) * offset;
    this._drawDot(ctx, x2, y2, size * 0.8, color, alpha * 0.9);
  }
}

export default BlekkProPMUBrushes;
