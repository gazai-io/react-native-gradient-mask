package expo.modules.gradientmask

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GradientMaskModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("GradientMask")

        // View definition
        View(GradientMaskView::class) {
            // colors: List of processed colors (from processColor in JS)
            Prop("colors") { view: GradientMaskView, colors: List<Int>? ->
                view.setColors(colors)
            }

            // locations: Array of floats (0-1) for gradient stops
            Prop("locations") { view: GradientMaskView, locations: List<Double>? ->
                view.setLocations(locations)
            }

            // direction: "top" | "bottom" | "left" | "right"
            Prop("direction") { view: GradientMaskView, direction: String? ->
                view.setDirection(direction ?: "top")
            }

            Prop("boundaryMode") { view: GradientMaskView, value: Boolean? -> view.setBoundaryMode(value ?: false) }
            Prop("visibleTop") { view: GradientMaskView, value: Double? -> view.setVisibleTop(value ?: 0.0) }
            Prop("visibleBottom") { view: GradientMaskView, value: Double? -> view.setVisibleBottom(value ?: 0.0) }
            Prop("edgeMode") { view: GradientMaskView, value: Boolean? -> view.setEdgeMode(value ?: false) }
            Prop("topHeight") { view: GradientMaskView, value: Double? -> view.setTopHeight(value ?: 0.0) }
            Prop("topHeightRatio") { view: GradientMaskView, value: Boolean? -> view.setTopHeightRatio(value ?: false) }
            Prop("bottomHeight") { view: GradientMaskView, value: Double? -> view.setBottomHeight(value ?: 0.0) }
            Prop("bottomHeightRatio") { view: GradientMaskView, value: Boolean? -> view.setBottomHeightRatio(value ?: false) }
            Prop("topOpacity") { view: GradientMaskView, value: Double? -> view.setTopOpacity(value ?: 1.0) }
            Prop("bottomOpacity") { view: GradientMaskView, value: Double? -> view.setBottomOpacity(value ?: 1.0) }
            OnViewDidUpdateProps { view: GradientMaskView -> view.applyMaskUpdates() }

            // maskOpacity: 0 = no mask effect, 1 = full gradient mask
            Prop("maskOpacity") { view: GradientMaskView, opacity: Double? ->
                view.setMaskOpacity(opacity ?: 1.0)
            }
        }
    }
}
