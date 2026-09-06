import XCTest

final class ViewportTouchUITests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "expo.modules.gradientmask.example")
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.terminate()
        app.launch()
        XCTAssertTrue(app.otherElements["touch-host"].waitForExistence(timeout: 30))
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
    func testAncestorWrapperCanBlockUnderlyingSibling() {
        button("toggle-restrict"); button("toggle-wrapper") // auto wrapper intercepts
        point(25).tap(); statusContains("background=0")
        statusContains("content=0")
        button("toggle-wrapper") // box-none wrapper allows sibling behind it
        point(25).tap(); statusContains("background=1")
        point(325).tap(); statusContains("background=2")
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
    func testPercentageBoundariesShareOrOverrideReference() {
        button("percent-bounds"); button("toggle-restrict")
        point(125).tap(); statusContains("content=1")
        point(325).tap(); statusContains("background=1")
        let frame = app.otherElements["touch-host"].frame
        button("toggle-reference")
        point(125).tap(); statusContains("background=2")
        point(325).tap(); statusContains("content=2")
        button("separate-bounds")
        point(125).tap(); statusContains("content=3")
        point(325).tap(); statusContains("background=3")
        XCTAssertEqual(app.otherElements["touch-host"].frame, frame)
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

// Run against the default Example (EXPO_PUBLIC_MASK_VALIDATION unset).
final class ScreenBoundaryUITests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "expo.modules.gradientmask.example")
    func testScreenLinesUseAbsoluteScreenPosition() {
        continueAfterFailure = false
        app.terminate(); app.launch()
        let host = app.otherElements["chat-mask-container"]
        XCTAssertTrue(host.waitForExistence(timeout: 15))
        let originalFrame = host.frame
        let topButton = app.buttons["Top 50% screen"]
        XCTAssertTrue(topButton.exists)
        topButton.tap()
        let topLine = app.otherElements["chat-top-line"]
        let screenMid = app.frame.midY
        let topAligned = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            abs(topLine.frame.minY - screenMid) < 1
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [topAligned], timeout: 5), .completed)
        print("SCREEN_BOUNDARY top=\(topLine.frame.minY) expected=\(screenMid) containerY=\(host.frame.minY)")
        let topShot = XCTAttachment(screenshot: app.screenshot())
        topShot.name = "top-screen-midpoint"; topShot.lifetime = .keepAlways; add(topShot)
        app.buttons["Bottom 100% ↔ 75%"].tap()
        let bottomLine = app.otherElements["chat-bottom-line"]
        let expectedBottom = app.frame.minY + app.frame.height * 0.75
        let bottomAligned = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            abs(bottomLine.frame.minY - expectedBottom) < 1
        }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [bottomAligned], timeout: 5), .completed)
        print("SCREEN_BOUNDARY bottom=\(bottomLine.frame.minY) expected=\(expectedBottom)")
        XCTAssertEqual(host.frame, originalFrame)
    }
}

// Recording choreography for the default Example; capture via simctl recordVideo.
final class DemoRecordingUITests: XCTestCase {
    func testRecordViewportDemo() {
        let app = XCUIApplication(bundleIdentifier: "expo.modules.gradientmask.example")
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Top 50% screen"].waitForExistence(timeout: 15))
        print("DEMO_RECORDING_STARTED")
        Thread.sleep(forTimeInterval: 4)
        for title in ["Top 50% screen", "Background: pattern", "Background: plain", "Bottom 100% ↔ 75%", "Fade 50% / 40px", "Top 0 ↔ 50%", "Mask on / off", "Mask on / off"] {
            app.buttons[title].tap()
            Thread.sleep(forTimeInterval: 1.5)
        }
        print("DEMO_RECORDING_FINISHED")
        Thread.sleep(forTimeInterval: 2)
    }
}

final class ChatPassThroughUITests: XCTestCase {
    func testChatHiddenAreaReachesActualPageBackground() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "expo.modules.gradientmask.example")
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Top 50% screen"].waitForExistence(timeout: 15))
        let host = app.otherElements["chat-mask-container"]
        let status = app.staticTexts["chat-background-taps"]
        func point(_ y: CGFloat) -> XCUICoordinate {
            host.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: host.frame.width / 2, dy: y))
        }
        func expect(_ count: Int) {
            let p = NSPredicate(format: "label == %@", "背景按鈕 · 點擊 \(count) 次")
            XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: p, object: status)], timeout: 5), .completed)
        }
        app.buttons["Top 50% screen"].tap()
        point(42).tap(); expect(0) // restriction disabled: list keeps the touch
        app.buttons["背景穿透：關"].tap()
        XCTAssertTrue(app.buttons["背景穿透：開"].waitForExistence(timeout: 5))
        point(42).tap(); expect(1) // restriction enabled: underlying page receives it
        let topY = app.otherElements["chat-top-line"].frame.minY - host.frame.minY
        point(topY + 10).tap(); expect(1) // feather is still interactive list area
        app.buttons["背景穿透：開"].tap()
        XCTAssertTrue(app.buttons["背景穿透：關"].waitForExistence(timeout: 5))
        point(42).tap(); expect(1)
        app.buttons["背景穿透：關"].tap()
        XCTAssertTrue(app.buttons["背景穿透：開"].waitForExistence(timeout: 5))
        point(42).tap(); expect(2)
        app.buttons["Bottom 100% ↔ 75%"].tap()
        point(host.frame.height - 25).tap(); expect(2) // no background button at this position
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "chat-background-pass-through"; attachment.lifetime = .keepAlways; add(attachment)
    }
}
