package expo.modules.gradientmask

internal object EdgeMaskGeometry {
    fun height(value: Double, ratio: Boolean, container: Float, density: Float = 1f): Float {
        if (!value.isFinite() || !container.isFinite() || !density.isFinite() || container <= 0f || density <= 0f) return 0f
        return (value.coerceAtLeast(0.0) * if (ratio) container.toDouble() else density.toDouble())
            .coerceAtMost(container.toDouble()).toFloat()
    }
    fun scale(top: Float, bottom: Float, container: Float): Float {
        val sum = top + bottom
        return if (sum > container && sum > 0f) container.coerceAtLeast(0f) / sum else 1f
    }
    fun containsTouch(y: Float, top: Double, bottom: Double, container: Float, density: Float): Boolean {
        val start = height(top, false, container, density)
        val end = maxOf(start, height(bottom, false, container, density))
        return y.isFinite() && end > start && y >= start && y < end
    }
    fun opacity(value: Double): Float = if (value.isFinite()) value.coerceIn(0.0, 1.0).toFloat() else 0f
}
