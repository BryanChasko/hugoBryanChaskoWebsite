/**
 * SkillsNetworkScene: 2D radial network graph visualization
 * Nodes = skills, edges = relationships. Interactive with mouse drag.
 */

class SkillsNetworkScene extends BaseScene {
  constructor(container, skillsData = [], options = {}) {
    options.useIntersectionObserver = true;
    super(container, options);

    this.skillsData = skillsData;
    this.nodes = [];
    this.edges = [];
    this.mouse = { x: 0, y: 0, isDragging: false };
    this.selectedNode = null;

    this.initializeNetwork();
    this.setupEventListeners();
    this.setupBuffers();
    this.startAnimating();
  }

  /**
   * Build node and edge structure from skills data
   */
  initializeNetwork() {
    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    const baseRadius = Math.min(this.options.width, this.options.height) / 4;

    // Create nodes from skills data
    let nodeId = 0;
    const nodeMap = {};

    // Center node (core)
    this.nodes.push({
      id: nodeId++,
      label: 'Skills',
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      radius: 8,
      layer: 0,
      color: this.getThemeColor('--nebula-orange'),
      fixed: true,
    });

    // Layer 1: Core skills
    if (this.skillsData.length > 0) {
      const coreSkills = this.skillsData.slice(0, Math.min(5, this.skillsData.length));
      const angleStep = (Math.PI * 2) / coreSkills.length;

      coreSkills.forEach((skill, i) => {
        const angle = angleStep * i;
        const x = centerX + Math.cos(angle) * baseRadius;
        const y = centerY + Math.sin(angle) * baseRadius;

        this.nodes.push({
          id: nodeId,
          label: skill,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 5,
          layer: 1,
          color: this.getThemeColor('--nebula-purple'),
          fixed: false,
        });

        // Connect to center
        this.edges.push({ from: 0, to: nodeId, strength: 0.5 });
        nodeMap[skill] = nodeId;
        nodeId++;
      });

      // Layer 2: Related skills (if provided)
      if (this.skillsData.length > 5) {
        const relatedSkills = this.skillsData.slice(5);
        const layer2AngleStep = (Math.PI * 2) / relatedSkills.length;

        relatedSkills.forEach((skill, i) => {
          const angle = layer2AngleStep * i + angleStep * 0.5; // Stagger between layer 1
          const x = centerX + Math.cos(angle) * (baseRadius * 1.6);
          const y = centerY + Math.sin(angle) * (baseRadius * 1.6);

          this.nodes.push({
            id: nodeId,
            label: skill,
            x,
            y,
            vx: 0,
            vy: 0,
            radius: 4,
            layer: 2,
            color: this.getThemeColor('--nebula-lavender'),
            fixed: false,
          });

          // Connect to nearest layer 1 node
          const nearestLayer1 = Math.floor(i / 2) % coreSkills.length;
          this.edges.push({ from: nearestLayer1 + 1, to: nodeId, strength: 0.3 });

          nodeId++;
        });
      }
    }
  }

  setupEventListeners() {
    this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.container.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.container.addEventListener('mouseleave', () => {
      this.mouse.isDragging = false;
      this.selectedNode = null;
    });
  }

  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    if (this.mouse.isDragging && this.selectedNode) {
      this.selectedNode.x = this.mouse.x;
      this.selectedNode.y = this.mouse.y;
      this.selectedNode.vx = 0;
      this.selectedNode.vy = 0;
    }
  }

  handleMouseDown(e) {
    const rect = this.container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if mouse is over a node
    for (let node of this.nodes) {
      const dist = Math.hypot(node.x - mx, node.y - my);
      if (dist < node.radius * 3) {
        this.selectedNode = node;
        this.mouse.isDragging = true;
        break;
      }
    }
  }

  handleMouseUp(e) {
    this.mouse.isDragging = false;
  }

  setupBuffers() {
    const positionAttr = this.gl.getAttribLocation(this.program, 'position');
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(positionAttr, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttr);

    this.uResolution = this.gl.getUniformLocation(this.program, 'resolution');
    this.uTime = this.gl.getUniformLocation(this.program, 'time');
    this.uColor = this.gl.getUniformLocation(this.program, 'color');
    this.uOpacity = this.gl.getUniformLocation(this.program, 'opacity');
    this.uPointSize = this.gl.getUniformLocation(this.program, 'pointSize');
  }

  getVertexShader() {
    return `
      precision highp float;
      attribute vec2 position;
      uniform vec2 resolution;

      void main() {
        vec2 normalized = position / resolution * 2.0 - 1.0;
        gl_Position = vec4(normalized, 0.0, 1.0);
      }
    `;
  }

  getFragmentShader() {
    return `
      precision highp float;
      uniform vec3 color;
      uniform float opacity;

      void main() {
        vec2 coord = gl_PointCoord - 0.5;
        float dist = length(coord);
        
        float alpha = smoothstep(0.5, 0.0, dist) * opacity;
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  update(deltaTime, elapsed) {
    // Simple physics: nodes repel each other and attract to center
    const repulsion = 200;
    const damping = 0.95;

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      if (node.fixed) continue;

      // Repulsion from other nodes
      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) continue;
        const other = this.nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.hypot(dx, dy) + 1;

        const fx = (dx / dist) * (repulsion / (dist * dist));
        const fy = (dy / dist) * (repulsion / (dist * dist));

        node.vx += fx * deltaTime;
        node.vy += fy * deltaTime;
      }

      // Attraction to connected nodes (via edges)
      for (let edge of this.edges) {
        if (edge.from === node.id) {
          const other = this.nodes[edge.to];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.hypot(dx, dy);

          const fx = (dx / dist) * edge.strength * 10;
          const fy = (dy / dist) * edge.strength * 10;

          node.vx += fx * deltaTime;
          node.vy += fy * deltaTime;
        } else if (edge.to === node.id) {
          const other = this.nodes[edge.from];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.hypot(dx, dy);

          const fx = (dx / dist) * edge.strength * 10;
          const fy = (dy / dist) * edge.strength * 10;

          node.vx += fx * deltaTime;
          node.vy += fy * deltaTime;
        }
      }

      // Apply velocity
      node.x += node.vx * deltaTime * 60;
      node.y += node.vy * deltaTime * 60;

      // Apply damping
      node.vx *= damping;
      node.vy *= damping;

      // Boundary wrapping
      if (node.x < 0) node.x = this.options.width;
      if (node.x > this.options.width) node.x = 0;
      if (node.y < 0) node.y = this.options.height;
      if (node.y > this.options.height) node.y = 0;
    }
  }

  render(deltaTime, elapsed) {
    if (!this.gl) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    const time = (Date.now() - this.startTime) / 1000;

    this.gl.uniform2f(this.uResolution, this.options.width, this.options.height);
    this.gl.uniform1f(this.uTime, time);

    // Draw edges (lines)
    for (let edge of this.edges) {
      const from = this.nodes[edge.from];
      const to = this.nodes[edge.to];

      const positions = new Float32Array([from.x, from.y, to.x, to.y]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);

      const edgeColor = this.getThemeColor('--nebula-lavender');
      this.gl.uniform3f(this.uColor, edgeColor[0], edgeColor[1], edgeColor[2]);
      this.gl.uniform1f(this.uOpacity, 0.3);
      this.gl.drawArrays(this.gl.LINE_STRIP, 0, 2);
    }

    // Draw nodes
    for (let node of this.nodes) {
      const positions = new Float32Array([node.x, node.y]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);

      this.gl.uniform3f(this.uColor, node.color[0], node.color[1], node.color[2]);
      this.gl.uniform1f(this.uOpacity, node === this.selectedNode ? 1.0 : 0.8);
      this.gl.uniform1f(this.uPointSize, node.radius * 2 + (node === this.selectedNode ? 4 : 0));

      this.gl.drawArrays(this.gl.POINTS, 0, 1);
    }
  }

  setupFallback() {
    // Create SVG fallback
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.options.width);
    svg.setAttribute('height', this.options.height);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    // Draw edges
    for (let edge of this.edges) {
      const from = this.nodes[edge.from];
      const to = this.nodes[edge.to];

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);
      line.setAttribute('y2', to.y);
      line.setAttribute('stroke', 'rgba(129, 105, 197, 0.3)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }

    // Draw nodes
    for (let node of this.nodes) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', node.radius * 2);
      circle.setAttribute('fill', `rgba(${Math.round(node.color[0] * 255)}, ${Math.round(node.color[1] * 255)}, ${Math.round(node.color[2] * 255)}, 0.8)`);
      svg.appendChild(circle);
    }

    this.container.appendChild(svg);
  }
}

// Export for global use
window.SkillsNetworkScene = SkillsNetworkScene;
