import XCTest

final class ViewportTouchUITests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "expo.modules.gradientmask.example")
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.terminate()
        app.launch()
        XCTAssertTrue(app.otherElements["touch-host"].waitForExistence(timeout: 15))
    }
    func point(_ y: CGFloat) -> XCUICoordinate {
        app.otherElements["touch-host"].coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: y / 400))
    }
    func button(_ name: String) { app.descendants(matching: .any).matching(identifier: name).firstMatch.tap() }
    func statusContains(_ text: String) {
        let element = app.staticTexts["touch-status"]
        let expectation = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", text), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 5), .completed)
    }
    func testOptionalRestrictionAndDynamicBounds() {
        point(25).tap(); statusContains("content=1") // default allows hidden row
        button("toggle-restrict")
        point(25).tap(); statusContains("background=1")
        point(325).tap(); statusContains("background=2")
        point(125).tap(); statusContains("content=2") // feather remains interactive
        button("toggle-bounds")
        point(125).tap(); statusContains("background=3") // updated shared boundaries
        button("toggle-mask")
        point(25).tap(); statusContains("content=3") // disabled mask bypasses restriction
        button("toggle-mask"); button("toggle-restrict")
        point(325).tap(); statusContains("content=4")
    }
    func testOutsideStartRejectedAndInsideDragContinuesOutside() {
        button("toggle-restrict")
        point(25).press(forDuration: 0.05, thenDragTo: point(200))
        statusContains("offset=0")
        point(200).press(forDuration: 0.05, thenDragTo: point(25))
        let status = app.staticTexts["touch-status"]
        let predicate = NSPredicate { _, _ in
            let value = status.label.components(separatedBy: "offset=").last ?? "0"
            return (Int(value) ?? 0) > 50
        }
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: predicate, object: status)], timeout: 5), .completed)
    }
    func sample(_ point: CGPoint) -> Int {
        let cg = app.screenshot().image.cgImage!
        let data = cg.dataProvider!.data! as Data
        let scale = CGFloat(cg.width) / app.frame.width
        let x = Int(point.x * scale), y = Int(point.y * scale)
        let offset = y * cg.bytesPerRow + x * (cg.bitsPerPixel / 8)
        XCTAssertGreaterThanOrEqual(offset, 0)
        XCTAssertLessThan(offset + 2, data.count)
        return data.withUnsafeBytes { raw in
            let bytes = raw.bindMemory(to: UInt8.self)
            return min(Int(bytes[offset]), Int(bytes[offset+1]), Int(bytes[offset+2]))
        }
    }
    func testScreenPercentageChangesFeatherWithoutChangingContainer() {
        let oracle = app.otherElements["reference-oracle"]
        XCTAssertTrue(oracle.exists)
        let frame = oracle.frame
        let p = CGPoint(x: frame.midX, y: frame.minY + 30)
        let container = sample(p)
        button("toggle-reference")
        let toggle = app.descendants(matching: .any).matching(identifier: "toggle-reference").firstMatch
        let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", "screen"), object: toggle)
        XCTAssertEqual(XCTWaiter.wait(for: [changed], timeout: 5), .completed)
        let expectation = XCTNSPredicateExpectation(predicate: NSPredicate { _,_ in self.sample(p) < container - 30 }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 5), .completed)
        print("SCREEN_PERCENTAGE container=\(container) screen=\(sample(p))")
        XCTAssertEqual(oracle.frame, frame)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "screen-percentage-oracle"; attachment.lifetime = .keepAlways; add(attachment)
    }
}
