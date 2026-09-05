func equal(_ actual: Double, _ expected: Double) {
    precondition(abs(actual - expected) < 0.00001, "Expected \(expected), received \(actual)")
}
equal(EdgeMaskGeometry.height(0.5, ratio: true, container: 400), 200)
equal(EdgeMaskGeometry.height(0.5, ratio: true, container: 200), 100)
equal(EdgeMaskGeometry.height(40, ratio: false, container: 400), 40)
equal(EdgeMaskGeometry.height(40, ratio: false, container: 800, density: 2), 80)
equal(EdgeMaskGeometry.height(0.5, ratio: true, container: 800, density: 2), 400)
equal(EdgeMaskGeometry.height(40, ratio: false, container: 0), 0)
equal(EdgeMaskGeometry.height(.nan, ratio: false, container: 400), 0)
equal(EdgeMaskGeometry.height(.infinity, ratio: true, container: 400), 0)
equal(EdgeMaskGeometry.height(-40, ratio: false, container: 400), 0)
equal(EdgeMaskGeometry.height(900, ratio: false, container: 400), 400)
equal(EdgeMaskGeometry.scale(top: 80, bottom: 80, container: 100), 0.625)
equal(EdgeMaskGeometry.scale(top: 0, bottom: 0, container: 0), 1)
equal(Double(EdgeMaskGeometry.opacity(.nan)), 0)
print("Swift edge geometry: 13 checks passed")

for (y, expected) in [(99.0, false), (100, true), (125, true), (299.9, true), (300, false), (301, false)] {
    precondition(EdgeMaskGeometry.containsTouch(y, top: 100, bottom: 300, container: 400) == expected)
}
precondition(!EdgeMaskGeometry.containsTouch(200, top: 300, bottom: 100, container: 400))
precondition(!EdgeMaskGeometry.containsTouch(0, top: 0, bottom: 0, container: 0))
precondition(EdgeMaskGeometry.containsTouch(1, top: -100, bottom: 500, container: 400))
precondition(!EdgeMaskGeometry.containsTouch(.nan, top: 0, bottom: 400, container: 400))
print("Swift touch range: 10 checks passed")
