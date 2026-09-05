import ExpoModulesCore
import UIKit

class GradientMaskView: ExpoView {
    // All layers are retained. Height/opacity updates never allocate a mask tree.
    private let maskRoot = CALayer()
    private let legacyGradient = CAGradientLayer()
    private let legacySolid = CALayer()
    private let topGradient = CAGradientLayer()
    private let topSolid = CALayer()
    private let bottomGradient = CAGradientLayer()
    private let bottomSolid = CALayer()
    private let middleSolid = CALayer()

    private var rawColors: [Int] = [0, -16777216]
    private var rawLocations: [Double] = [0, 1]
    private var profileDirty = true
    private var direction = "top"
    private var maskOpacity: Float = 1
    private var edgeMode = false
    private var boundaryMode = false
    private var visibleTop = 0.0
    private var visibleBottom = 0.0
    private var topHeight = 0.0
    private var topHeightRatio = false
    private var bottomHeight = 0.0
    private var bottomHeightRatio = false
    private var topOpacity: Float = 1
    private var bottomOpacity: Float = 1
    private var hasTransparency = true

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        backgroundColor = .clear
        clipsToBounds = true
        for solid in [legacySolid, topSolid, bottomSolid, middleSolid] {
            solid.backgroundColor = UIColor.black.cgColor
        }
        for child in [legacyGradient, legacySolid, topGradient, topSolid, bottomGradient, bottomSolid, middleSolid] {
            maskRoot.addSublayer(child)
        }
        topGradient.startPoint = CGPoint(x: 0.5, y: 0)
        topGradient.endPoint = CGPoint(x: 0.5, y: 1)
        bottomGradient.startPoint = CGPoint(x: 0.5, y: 1)
        bottomGradient.endPoint = CGPoint(x: 0.5, y: 0)
    }

    func setColors(_ colors: [Int]?) {
        let next = colors?.isEmpty == false ? colors! : [0, -16777216]
        if next != rawColors { rawColors = next; profileDirty = true }
    }
    func setLocations(_ locations: [Double]?) {
        let next = locations ?? [0, 1]
        if next != rawLocations { rawLocations = next; profileDirty = true }
    }
    func setDirection(_ value: String) { direction = value }
    func setMaskOpacity(_ value: Double) { maskOpacity = EdgeMaskGeometry.opacity(value) }
    func setBoundaryMode(_ value: Bool) { boundaryMode = value }
    func setVisibleTop(_ value: Double) { visibleTop = value }
    func setVisibleBottom(_ value: Double) { visibleBottom = value }
    func setEdgeMode(_ value: Bool) { edgeMode = value }
    func setTopHeight(_ value: Double) { topHeight = value }
    func setTopHeightRatio(_ value: Bool) { topHeightRatio = value }
    func setBottomHeight(_ value: Double) { bottomHeight = value }
    func setBottomHeightRatio(_ value: Bool) { bottomHeightRatio = value }
    func setTopOpacity(_ value: Double) { topOpacity = EdgeMaskGeometry.opacity(value) }
    func setBottomOpacity(_ value: Double) { bottomOpacity = EdgeMaskGeometry.opacity(value) }

    override func layoutSubviews() {
        super.layoutSubviews()
        applyMaskUpdates()
    }

    // Called once after a complete prop batch, including Reanimated updates.
    func applyMaskUpdates() {
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        defer { CATransaction.commit() }

        if profileDirty {
            var colors = rawColors
            if colors.count == 1 { colors.append(colors[0]) }
            let cgColors = colors.map { value -> CGColor in
                let alpha = CGFloat((UInt32(truncatingIfNeeded: value) >> 24) & 255) / 255
                return UIColor(white: 0, alpha: alpha).cgColor
            }
            let validLocations = rawLocations.count == colors.count && rawLocations.enumerated().allSatisfy {
                $0.element.isFinite && $0.element >= 0 && $0.element <= 1 &&
                    ($0.offset == 0 || $0.element >= rawLocations[$0.offset - 1])
            }
            let locations: [NSNumber] = validLocations ? rawLocations.map { NSNumber(value: $0) } :
                colors.indices.map { NSNumber(value: Double($0) / Double(colors.count - 1)) }
            for gradient in [legacyGradient, topGradient, bottomGradient] {
                gradient.colors = cgColors
                gradient.locations = locations
            }
            hasTransparency = colors.contains { ((UInt32(truncatingIfNeeded: $0) >> 24) & 255) < 255 }
            profileDirty = false
        }

        let h = Double(bounds.height)
        var top = EdgeMaskGeometry.height(topHeight, ratio: topHeightRatio, container: h)
        var bottom = EdgeMaskGeometry.height(bottomHeight, ratio: bottomHeightRatio, container: h)
        let start = boundaryMode ? EdgeMaskGeometry.height(visibleTop, ratio: false, container: h) : 0
        let end = boundaryMode ? max(start, EdgeMaskGeometry.height(visibleBottom, ratio: false, container: h)) : h
        let scale = EdgeMaskGeometry.scale(top: top, bottom: bottom, container: end - start)
        top *= scale
        bottom *= scale
        let activeEdges = (top > 0 && topOpacity > 0) || (bottom > 0 && bottomOpacity > 0)
        let active = maskOpacity > 0 && bounds.width > 0 && h > 0 && (boundaryMode || (hasTransparency && (!edgeMode || activeEdges)))
        if active {
            if layer.mask !== maskRoot { layer.mask = maskRoot }
        } else {
            layer.mask = nil
            return
        }
        maskRoot.frame = bounds
        legacyGradient.isHidden = edgeMode
        legacySolid.isHidden = edgeMode
        topGradient.isHidden = !edgeMode || top <= 0
        topSolid.isHidden = !edgeMode || top <= 0
        bottomGradient.isHidden = !edgeMode || bottom <= 0
        bottomSolid.isHidden = !edgeMode || bottom <= 0
        middleSolid.isHidden = !edgeMode

        if edgeMode {
            let topFrame = CGRect(x: 0, y: CGFloat(start), width: bounds.width, height: CGFloat(top))
            let bottomFrame = CGRect(x: 0, y: CGFloat(end - bottom), width: bounds.width, height: CGFloat(bottom))
            topGradient.frame = topFrame
            topSolid.frame = topFrame
            bottomGradient.frame = bottomFrame
            bottomSolid.frame = bottomFrame
            middleSolid.frame = CGRect(x: 0, y: CGFloat(start + top), width: bounds.width, height: CGFloat(max(0, end - start - top - bottom)))
            topSolid.opacity = 1 - maskOpacity * topOpacity
            bottomSolid.opacity = 1 - maskOpacity * bottomOpacity
        } else {
            legacyGradient.frame = bounds
            legacySolid.frame = bounds
            legacySolid.opacity = 1 - maskOpacity
            switch direction {
            case "bottom":
                legacyGradient.startPoint = CGPoint(x: 0.5, y: 1)
                legacyGradient.endPoint = CGPoint(x: 0.5, y: 0)
            case "left":
                legacyGradient.startPoint = CGPoint(x: 0, y: 0.5)
                legacyGradient.endPoint = CGPoint(x: 1, y: 0.5)
            case "right":
                legacyGradient.startPoint = CGPoint(x: 1, y: 0.5)
                legacyGradient.endPoint = CGPoint(x: 0, y: 0.5)
            default:
                legacyGradient.startPoint = CGPoint(x: 0.5, y: 0)
                legacyGradient.endPoint = CGPoint(x: 0.5, y: 1)
            }
        }
    }
}
