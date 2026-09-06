import ExpoModulesCore

public class GradientMaskModule: Module {
    public func definition() -> ModuleDefinition {
        Name("GradientMask")

        View(GradientMaskView.self) {
            // colors: List of processed colors (from processColor in JS)
            Prop("colors") { (view: GradientMaskView, colors: [Int]?) in
                view.setColors(colors)
            }

            // locations: Array of floats (0-1) for gradient stops
            Prop("locations") { (view: GradientMaskView, locations: [Double]?) in
                view.setLocations(locations)
            }

            // direction: "top" | "bottom" | "left" | "right"
            Prop("maskDirection") { (view: GradientMaskView, direction: String?) in
                view.setDirection(direction ?? "top")
            }

            Prop("restrictTouchesToVisibleArea") { (view: GradientMaskView, value: Bool?) in view.setRestrictTouchesToVisibleArea(value ?? false) }
            Prop("boundaryMode") { (view: GradientMaskView, value: Bool?) in view.setBoundaryMode(value ?? false) }
            Prop("visibleTopRatio") { (view: GradientMaskView, value: Bool?) in view.setVisibleTopRatio(value ?? false) }
            Prop("visibleBottomRatio") { (view: GradientMaskView, value: Bool?) in view.setVisibleBottomRatio(value ?? false) }
            Prop("visibleTop") { (view: GradientMaskView, value: Double?) in view.setVisibleTop(value ?? 0) }
            Prop("visibleBottom") { (view: GradientMaskView, value: Double?) in view.setVisibleBottom(value ?? 0) }
            Prop("edgeMode") { (view: GradientMaskView, value: Bool?) in view.setEdgeMode(value ?? false) }
            Prop("topHeight") { (view: GradientMaskView, value: Double?) in view.setTopHeight(value ?? 0) }
            Prop("topHeightRatio") { (view: GradientMaskView, value: Bool?) in view.setTopHeightRatio(value ?? false) }
            Prop("bottomHeight") { (view: GradientMaskView, value: Double?) in view.setBottomHeight(value ?? 0) }
            Prop("bottomHeightRatio") { (view: GradientMaskView, value: Bool?) in view.setBottomHeightRatio(value ?? false) }
            Prop("topOpacity") { (view: GradientMaskView, value: Double?) in view.setTopOpacity(value ?? 1) }
            Prop("bottomOpacity") { (view: GradientMaskView, value: Double?) in view.setBottomOpacity(value ?? 1) }
            OnViewDidUpdateProps { (view: GradientMaskView) in view.applyMaskUpdates() }

            // maskOpacity: 0 = no mask effect, 1 = full gradient mask
            Prop("maskOpacity") { (view: GradientMaskView, opacity: Double?) in
                view.setMaskOpacity(opacity ?? 1.0)
            }
        }
    }
}
