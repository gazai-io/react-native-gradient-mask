package expo.modules.gradientmask

import org.junit.Assert.assertEquals
import org.junit.Test

class EdgeMaskGeometryTest {
    @Test fun touchRangeClampsAndUsesDensity() {
        for ((y, expected) in listOf(199f to false, 200f to true, 250f to true, 599f to true, 600f to false)) {
            assertEquals(expected, EdgeMaskGeometry.containsTouch(y, 100.0, 300.0, 800f, 2f))
        }
        assertEquals(false, EdgeMaskGeometry.containsTouch(200f, 300.0, 100.0, 400f, 1f))
        assertEquals(false, EdgeMaskGeometry.containsTouch(0f, 0.0, 0.0, 0f, 1f))
        assertEquals(true, EdgeMaskGeometry.containsTouch(1f, -100.0, 500.0, 400f, 1f))
        assertEquals(false, EdgeMaskGeometry.containsTouch(Float.NaN, 0.0, 400.0, 400f, 1f))
    }
    @Test fun mixedUnitsAndResize() {
        assertEquals(200f, EdgeMaskGeometry.height(0.5, true, 400f), 0.0001f)
        assertEquals(100f, EdgeMaskGeometry.height(0.5, true, 200f), 0.0001f)
        assertEquals(40f, EdgeMaskGeometry.height(40.0, false, 400f), 0.0001f)
        assertEquals(80f, EdgeMaskGeometry.height(40.0, false, 800f, 2f), 0.0001f)
        assertEquals(400f, EdgeMaskGeometry.height(0.5, true, 800f, 2f), 0.0001f)
    }
    @Test fun invalidSizesAndOverlap() {
        assertEquals(0f, EdgeMaskGeometry.height(40.0, false, 0f), 0f)
        assertEquals(0f, EdgeMaskGeometry.height(Double.NaN, false, 400f), 0f)
        assertEquals(0f, EdgeMaskGeometry.height(Double.POSITIVE_INFINITY, true, 400f), 0f)
        assertEquals(0f, EdgeMaskGeometry.height(-40.0, false, 400f), 0f)
        assertEquals(400f, EdgeMaskGeometry.height(900.0, false, 400f), 0f)
        assertEquals(0.625f, EdgeMaskGeometry.scale(80f, 80f, 100f), 0f)
        assertEquals(1f, EdgeMaskGeometry.scale(0f, 0f, 0f), 0f)
        assertEquals(0f, EdgeMaskGeometry.opacity(Double.NaN), 0f)
    }
    @org.junit.Test fun percentageBoundaryTouches() {
        org.junit.Assert.assertTrue(EdgeMaskGeometry.containsTouch(250f, .25, .75, 800f, 2f, true, true))
        org.junit.Assert.assertFalse(EdgeMaskGeometry.containsTouch(650f, .25, .75, 800f, 2f, true, true))
        org.junit.Assert.assertFalse(EdgeMaskGeometry.containsTouch(250f, 200.0, 600.0, 800f, 2f))
        org.junit.Assert.assertTrue(EdgeMaskGeometry.containsTouch(650f, 200.0, 600.0, 800f, 2f))
    }
}
