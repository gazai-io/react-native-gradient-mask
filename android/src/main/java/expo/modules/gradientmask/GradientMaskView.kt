package expo.modules.gradientmask

import android.content.Context
import android.graphics.*
import android.view.View
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * GradientMaskView - Native gradient transparency mask
 *
 * Uses Bitmap as mask with setLayerType + PorterDuff.Mode.DST_IN
 *
 * Color semantics (consistent with iOS CAGradientLayer mask):
 * - Color's alpha value determines content visibility in that area
 * - alpha = 0 → content transparent (see background)
 * - alpha = 255 → content opaque (see content)
 *
 * maskOpacity controls gradient mask effect intensity:
 * - maskOpacity = 0 → no gradient effect, content fully visible (all alpha=255)
 * - maskOpacity = 1 → full gradient effect (use original alpha)
 *
 * Performance optimization:
 * - Base gradient bitmap (baseMaskBitmap) only rebuilt when colors/locations/direction/size change
 * - maskOpacity changes only use ColorMatrix to adjust alpha, no bitmap rebuild
 */
class GradientMaskView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    // Gradient mask parameters
    private var colors: IntArray? = null
    private var locations: FloatArray? = null
    private var direction: String = "top"

    // maskOpacity: 0 = no gradient effect, 1 = full gradient effect
    private var maskOpacity: Float = 1f

    // Base gradient bitmap (full gradient effect, original gradient used when maskOpacity=1)
    private var baseMaskBitmap: Bitmap? = null
    // Whether base bitmap needs rebuild (only when colors/locations/direction/size change)
    private var baseBitmapInvalidated = true

    // Paint for drawing
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val porterDuffXferMode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)

    // ColorMatrix for adjusting mask alpha
    private val colorMatrix = ColorMatrix()
    private val colorMatrixFilter = ColorMatrixColorFilter(colorMatrix)

    init {
        // Ensure background is transparent
        setBackgroundColor(Color.TRANSPARENT)
        // Always use SOFTWARE mode to avoid black flash when dynamically switching layer modes
        setLayerType(View.LAYER_TYPE_SOFTWARE, null)

        android.util.Log.d("GradientMask", "=== GradientMaskView init ===")
    }

    // MARK: - Props setters

    fun setColors(colorArray: List<Int>?) {
        colors = colorArray?.toIntArray()
        baseBitmapInvalidated = true
        invalidate()
    }

    fun setLocations(locationArray: List<Double>?) {
        locations = locationArray?.map { it.toFloat() }?.toFloatArray()
        baseBitmapInvalidated = true
        invalidate()
    }

    fun setDirection(dir: String) {
        direction = dir
        baseBitmapInvalidated = true
        invalidate()
    }

    fun setMaskOpacity(opacity: Double) {
        val newOpacity = opacity.toFloat().coerceIn(0f, 1f)
        if (newOpacity != maskOpacity) {
            maskOpacity = newOpacity
            // Only need to invalidate, no bitmap rebuild needed
            // dispatchDraw will use ColorMatrix to adjust alpha
            invalidate()
        }
    }

    // MARK: - Layout

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w > 0 && h > 0) {
            updateBaseMaskBitmap()
            baseBitmapInvalidated = false
        }
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        super.onLayout(changed, l, t, r, b)
        if (changed) {
            baseBitmapInvalidated = true
        }
    }

    // MARK: - Drawing

    override fun dispatchDraw(canvas: Canvas) {
        // Check if dimensions are valid
        if (width <= 0 || height <= 0) {
            super.dispatchDraw(canvas)
            return
        }

        // If base bitmap needs update, recreate it
        if (baseBitmapInvalidated) {
            updateBaseMaskBitmap()
            baseBitmapInvalidated = false
        }

        val bitmap = baseMaskBitmap
        // If no mask bitmap or maskOpacity=0, draw children directly (no mask effect)
        if (bitmap == null || maskOpacity <= 0f) {
            super.dispatchDraw(canvas)
            return
        }

        // Use saveLayer to create offscreen buffer
        val saveCount = canvas.saveLayer(
            0f, 0f,
            width.toFloat(), height.toFloat(),
            null
        )

        try {
            // First draw all children to offscreen buffer
            super.dispatchDraw(canvas)

            // Apply mask (using DST_IN mode)
            // Use ColorMatrix to adjust alpha, implementing maskOpacity effect
            // This way we don't need to rebuild bitmap every time maskOpacity changes
            paint.xfermode = porterDuffXferMode
            paint.colorFilter = if (maskOpacity < 1f) {
                // Use ColorMatrix to blend original alpha with fully opaque
                // maskOpacity = 0 → all pixels' alpha becomes 255 (fully visible)
                // maskOpacity = 1 → use original alpha
                //
                // ColorMatrix alpha row: [0, 0, 0, scale, translate]
                // Result alpha = originalAlpha * scale + translate
                //
                // We want: resultAlpha = 255 + (originalAlpha - 255) * maskOpacity
                //        = 255 * (1 - maskOpacity) + originalAlpha * maskOpacity
                // So: scale = maskOpacity, translate = 255 * (1 - maskOpacity)
                colorMatrix.set(floatArrayOf(
                    1f, 0f, 0f, 0f, 0f,           // R
                    0f, 1f, 0f, 0f, 0f,           // G
                    0f, 0f, 1f, 0f, 0f,           // B
                    0f, 0f, 0f, maskOpacity, 255f * (1f - maskOpacity)  // A
                ))
                ColorMatrixColorFilter(colorMatrix)
            } else {
                null
            }
            canvas.drawBitmap(bitmap, 0f, 0f, paint)
            paint.xfermode = null
            paint.colorFilter = null
        } finally {
            canvas.restoreToCount(saveCount)
        }
    }

    /**
     * Update base gradient bitmap
     * This bitmap contains original gradient effect (effect when maskOpacity = 1)
     * maskOpacity adjustment is implemented via ColorMatrix in dispatchDraw
     */
    private fun updateBaseMaskBitmap() {
        if (width <= 0 || height <= 0) return

        // Recycle old bitmap
        baseMaskBitmap?.recycle()

        // Create new mask bitmap
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val bitmapCanvas = Canvas(bitmap)

        val currentColors = colors
        val currentLocations = locations

        // If no colors/locations, create white mask (content fully visible)
        if (currentColors == null || currentLocations == null ||
            currentColors.size != currentLocations.size ||
            currentColors.isEmpty()) {
            bitmapCanvas.drawColor(Color.WHITE)
            baseMaskBitmap = bitmap
            return
        }

        // Convert colors to white + original alpha (mask only needs alpha channel)
        val maskColors = IntArray(currentColors.size) { i ->
            val originalColor = currentColors[i]
            val originalAlpha = Color.alpha(originalColor)
            Color.argb(originalAlpha, 255, 255, 255)
        }

        // Create gradient shader
        val (startX, startY, endX, endY) = getGradientCoordinates()
        val shader = LinearGradient(
            startX, startY, endX, endY,
            maskColors,
            currentLocations,
            Shader.TileMode.CLAMP
        )

        // Draw gradient to bitmap
        val gradientPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.shader = shader
        }
        bitmapCanvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), gradientPaint)

        baseMaskBitmap = bitmap
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        baseMaskBitmap?.recycle()
        baseMaskBitmap = null
    }

    private fun getGradientCoordinates(): List<Float> {
        return when (direction) {
            "top" -> listOf(0f, 0f, 0f, height.toFloat())
            "bottom" -> listOf(0f, height.toFloat(), 0f, 0f)
            "left" -> listOf(0f, 0f, width.toFloat(), 0f)
            "right" -> listOf(width.toFloat(), 0f, 0f, 0f)
            else -> listOf(0f, 0f, 0f, height.toFloat())
        }
    }
}
