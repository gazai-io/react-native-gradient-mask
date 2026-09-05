// Pure geometry: tested independently of UIKit / Expo.
enum EdgeMaskGeometry {
    static func height(_ value: Double, ratio: Bool, container: Double, density: Double = 1) -> Double {
        guard value.isFinite, container.isFinite, density.isFinite, container > 0, density > 0 else { return 0 }
        return min(container, max(0, value) * (ratio ? container : density))
    }
    static func scale(top: Double, bottom: Double, container: Double) -> Double {
        let sum = top + bottom
        return sum > container && sum > 0 ? max(0, container) / sum : 1
    }
    static func opacity(_ value: Double) -> Float {
        value.isFinite ? Float(min(1, max(0, value))) : 0
    }
}
