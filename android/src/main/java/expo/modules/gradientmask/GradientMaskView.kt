package expo.modules.gradientmask

import android.content.Context
import android.graphics.Rect
import android.view.MotionEvent
import com.facebook.react.touch.ReactHitSlopView
import kotlin.math.ceil
import kotlin.math.floor
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Shader
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * One hardware-compatible offscreen pass, drawing children once.
 * DST_OUT removes (1 - profile alpha) * intensity; this equals the previous DST_IN result.
 * Unit-sized shaders are retained. Canvas transforms change fade height/direction without
 * allocating full-view bitmaps, shaders, color filters or arrays on animation frames.
 */
class GradientMaskView(context: Context, appContext: AppContext) : ExpoView(context, appContext), ReactHitSlopView {
    private var colors = intArrayOf(Color.TRANSPARENT, Color.BLACK)
    private var locations = floatArrayOf(0f, 1f)
    private var profileDirty = true
    private var verticalShader: LinearGradient? = null
    private var horizontalShader: LinearGradient? = null
    private var hasTransparency = true
    private var direction = "top"
    private var maskOpacity = 1f
    private var edgeMode = false
    private var boundaryMode = false
    private var restrictTouchesToVisibleArea = false
    private val touchInsets = Rect()
    private val restrictNewTouches: Boolean
        get() = boundaryMode && restrictTouchesToVisibleArea && maskOpacity > 0f

    // RN's JS responder target search happens separately from native dispatchTouchEvent.
    // Negative hitSlop contracts its target search; clipChildren prevents descending outside it.
    // Reuse one Rect. Resolve current native bounds/density only when hit testing is requested.
    override val hitSlopRect: Rect?
        get() {
            if (!restrictNewTouches) return null
            val h = height.toFloat()
            val density = resources.displayMetrics.density
            val start = EdgeMaskGeometry.height(visibleTop, visibleTopRatio, h, density)
            val end = maxOf(start, EdgeMaskGeometry.height(visibleBottom, visibleBottomRatio, h, density))
            touchInsets.set(0, -ceil(start).toInt(), 0, floor(end).toInt() - height)
            return touchInsets
        }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        // Check DOWN only: MOVE/UP continue to the original child even after bounds change.
        if (event.actionMasked == MotionEvent.ACTION_DOWN && restrictNewTouches &&
            !EdgeMaskGeometry.containsTouch(event.y, visibleTop, visibleBottom, height.toFloat(), resources.displayMetrics.density, visibleTopRatio, visibleBottomRatio)) {
            return false
        }
        return super.dispatchTouchEvent(event)
    }
    private var visibleTop = 0.0
    private var visibleBottom = 0.0
    private var visibleTopRatio = false
    private var visibleBottomRatio = false
    private var topHeight = 0.0
    private var topHeightRatio = false
    private var bottomHeight = 0.0
    private var bottomHeightRatio = false
    private var topOpacity = 1f
    private var bottomOpacity = 1f
    private val maskPaint = Paint().apply {
        xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_OUT)
    }

    init {
        setBackgroundColor(Color.TRANSPARENT)
        clipChildren = true
        setWillNotDraw(false)
        // Keep the inherited hardware rendering path. Do not force a software layer.
    }

    fun setColors(value: List<Int>?) {
        val next = if (value.isNullOrEmpty()) intArrayOf(Color.TRANSPARENT, Color.BLACK) else value.toIntArray()
        if (!colors.contentEquals(next)) { colors = next; profileDirty = true }
    }
    fun setLocations(value: List<Double>?) {
        val next = value?.map { it.toFloat() }?.toFloatArray() ?: floatArrayOf(0f, 1f)
        if (!locations.contentEquals(next)) { locations = next; profileDirty = true }
    }
    fun setDirection(value: String) { direction = value }
    fun setMaskOpacity(value: Double) { maskOpacity = EdgeMaskGeometry.opacity(value) }
    fun setRestrictTouchesToVisibleArea(value: Boolean) { restrictTouchesToVisibleArea = value }
    fun setBoundaryMode(value: Boolean) { boundaryMode = value }
    fun setVisibleTopRatio(value: Boolean) { visibleTopRatio = value }
    fun setVisibleBottomRatio(value: Boolean) { visibleBottomRatio = value }
    fun setVisibleTop(value: Double) { visibleTop = value }
    fun setVisibleBottom(value: Double) { visibleBottom = value }
    fun setEdgeMode(value: Boolean) { edgeMode = value }
    fun setTopHeight(value: Double) { topHeight = value }
    fun setTopHeightRatio(value: Boolean) { topHeightRatio = value }
    fun setBottomHeight(value: Double) { bottomHeight = value }
    fun setBottomHeightRatio(value: Boolean) { bottomHeightRatio = value }
    fun setTopOpacity(value: Double) { topOpacity = EdgeMaskGeometry.opacity(value) }
    fun setBottomOpacity(value: Double) { bottomOpacity = EdgeMaskGeometry.opacity(value) }

    // One invalidation after the complete prop batch, no child layout request.
    fun applyMaskUpdates() { invalidate() }

    private fun updateProfile() {
        if (!profileDirty) return
        val input = if (colors.size == 1) intArrayOf(colors[0], colors[0]) else colors
        val removalColors = IntArray(input.size) { Color.argb(255 - Color.alpha(input[it]), 0, 0, 0) }
        hasTransparency = removalColors.any { Color.alpha(it) > 0 }
        val valid = locations.size == input.size && locations.indices.all {
            locations[it].isFinite() && locations[it] >= 0f && locations[it] <= 1f &&
                (it == 0 || locations[it] >= locations[it - 1])
        }
        val stops = if (valid) locations else FloatArray(input.size) { it.toFloat() / (input.size - 1) }
        verticalShader = LinearGradient(0f, 0f, 0f, 1f, removalColors, stops, Shader.TileMode.CLAMP)
        horizontalShader = LinearGradient(0f, 0f, 1f, 0f, removalColors, stops, Shader.TileMode.CLAMP)
        profileDirty = false
    }

    override fun draw(canvas: Canvas) {
        if (width <= 0 || height <= 0 || maskOpacity <= 0f) { super.draw(canvas); return }
        updateProfile()
        if (!hasTransparency && !boundaryMode) { super.draw(canvas); return }
        val w = width.toFloat()
        val h = height.toFloat()
        var top = EdgeMaskGeometry.height(topHeight, topHeightRatio, h, resources.displayMetrics.density)
        var bottom = EdgeMaskGeometry.height(bottomHeight, bottomHeightRatio, h, resources.displayMetrics.density)
        val start = if (boundaryMode) EdgeMaskGeometry.height(visibleTop, visibleTopRatio, h, resources.displayMetrics.density) else 0f
        val end = if (boundaryMode) maxOf(start, EdgeMaskGeometry.height(visibleBottom, visibleBottomRatio, h, resources.displayMetrics.density)) else h
        if (boundaryMode && end <= start) return
        val scale = EdgeMaskGeometry.scale(top, bottom, end - start)
        top *= scale
        bottom *= scale
        if (!boundaryMode && edgeMode && !(top > 0f && topOpacity > 0f) && !(bottom > 0f && bottomOpacity > 0f)) {
            super.draw(canvas)
            return
        }
        val layer = canvas.saveLayer(0f, 0f, w, h, null)
        try {
            if (boundaryMode) canvas.clipRect(0f, start, w, end)
            super.draw(canvas)
            if (edgeMode) {
                if (top > 0f && topOpacity > 0f) drawVertical(canvas, w, top, start, false, maskOpacity * topOpacity)
                if (bottom > 0f && bottomOpacity > 0f) drawVertical(canvas, w, bottom, end, true, maskOpacity * bottomOpacity)
            } else if (direction == "left" || direction == "right") {
                maskPaint.shader = horizontalShader
                maskPaint.alpha = (255f * maskOpacity).toInt()
                val save = canvas.save()
                if (direction == "right") { canvas.translate(w, 0f); canvas.scale(-w, 1f) }
                else canvas.scale(w, 1f)
                canvas.drawRect(0f, 0f, 1f, h, maskPaint)
                canvas.restoreToCount(save)
            } else {
                drawVertical(canvas, w, h, if (direction == "bottom") h else 0f, direction == "bottom", maskOpacity)
            }
        } finally {
            canvas.restoreToCount(layer)
        }
    }

    private fun drawVertical(canvas: Canvas, width: Float, height: Float, y: Float, reverse: Boolean, opacity: Float) {
        maskPaint.shader = verticalShader
        maskPaint.alpha = (255f * opacity).toInt()
        val save = canvas.save()
        canvas.translate(0f, y)
        canvas.scale(1f, if (reverse) -height else height)
        canvas.drawRect(0f, 0f, width, 1f, maskPaint)
        canvas.restoreToCount(save)
    }
}
