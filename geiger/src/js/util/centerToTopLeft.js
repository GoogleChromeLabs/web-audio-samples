

export const centerToTopLeft = (center, radius) => {
  return {
    top: center.x - radius,
    left: center.y - radius
  }
}