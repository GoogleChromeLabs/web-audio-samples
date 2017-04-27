/**
 * [drawJoint description]
 * @param  {[type]} joint   [description]
 * @param  {[type]} context [description]
 * @return {[type]}         [description]
 */
function drawJoint (joint, context) {
  let b1 = joint.m_body1;
  let b2 = joint.m_body2;
  let x1 = b1.m_position;
  let x2 = b2.m_position;
  let p1 = joint.GetAnchor1();
  let p2 = joint.GetAnchor2();
  context.strokeStyle = '#00eeee';
  context.beginPath();

  switch (joint.m_type) {
    case b2Joint.e_distanceJoint:
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      break;

    case b2Joint.e_pulleyJoint:
      // TODO
      break;

    default:
      if (b1 == world.m_groundBody) {
        context.moveTo(p1.x, p1.y);
        context.lineTo(x2.x, x2.y);
      } else if (b2 == world.m_groundBody) {
        context.moveTo(p1.x, p1.y);
        context.lineTo(x1.x, x1.y);
      } else {
        context.moveTo(x1.x, x1.y);
        context.lineTo(p1.x, p1.y);
        context.lineTo(x2.x, x2.y);
        context.lineTo(p2.x, p2.y);
      }
      break;
  }
  context.stroke();
}


/**
 * [drawShape description]
 * @param  {[type]} shape   [description]
 * @param  {[type]} context [description]
 * @return {[type]}         [description]
 */
function drawShape (shape, context) {
  context.strokeStyle = '#ffffff';
  context.beginPath();

  switch (shape.m_type) {
    case b2Shape.e_circleShape:
      let circle = shape;
      let pos = circle.m_position;
      let r = circle.m_radius;
      let segments = 16.0;
      let theta = 0.0;
      let dtheta = 2.0 * Math.PI / segments;

      // draw circle
      context.moveTo(pos.x + r, pos.y);
      for (let i = 0; i < segments; i++) {
        let d = new b2Vec2(r * Math.cos(theta), r * Math.sin(theta));
        let v = b2Math.AddVV(pos, d);
        context.lineTo(v.x, v.y);
        theta += dtheta;
      }
      context.lineTo(pos.x + r, pos.y);

      // draw radius
      context.moveTo(pos.x, pos.y);
      let ax = circle.m_R.col1;
      let pos2 = new b2Vec2(pos.x + r * ax.x, pos.y + r * ax.y);
      context.lineTo(pos2.x, pos2.y);
      break;

    case b2Shape.e_polyShape:
      let poly = shape;
      let tV = b2Math.AddVV(poly.m_position,
                            b2Math.b2MulMV(poly.m_R, poly.m_vertices[0]));
      context.moveTo(tV.x, tV.y);
      for (let i = 0; i < poly.m_vertexCount; i++) {
        let v = b2Math.AddVV(poly.m_position,
                             b2Math.b2MulMV(poly.m_R, poly.m_vertices[i]));
        context.lineTo(v.x, v.y);
      }
      context.lineTo(tV.x, tV.y);
      break;
    }
  context.stroke();
}


/**
 * [drawWorld description]
 * @param  {[type]} world   [description]
 * @param  {[type]} context [description]
 * @return {[type]}         [description]
 */
function drawWorld (world, context) {
  for (var j = world.m_jointList; j; j = j.m_next) {
    drawJoint(j, context);
  }
  for (var b = world.m_bodyList; b; b = b.m_next) {
    for (var s = b.GetShapeList(); s != null; s = s.GetNext()) {
      drawShape(s, context);
    }
  }
}
