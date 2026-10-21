use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// 2D point in radiograph coordinates (pixels or millimeters).
/// Mirrors `System.Drawing.PointF` and `Delaire_BO.ModeleAnalyse.basePoint`.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Point2D {
    pub x: f64,
    pub y: f64,
}

impl Point2D {
    pub const fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }
}

/// Infinite 2D line parameterized by two distinct points or normal form `a*x + b*y + c = 0`.
/// Mirrors `Delaire_BO.ModeleAnalyse.Droite` from `Delaire_BO.dll`.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Line2D {
    pub p1: Point2D,
    pub p2: Point2D,
}

impl Line2D {
    pub fn from_points(p1: Point2D, p2: Point2D) -> Self {
        Self { p1, p2 }
    }

    pub fn direction(&self) -> (f64, f64) {
        let dx = self.p2.x - self.p1.x;
        let dy = self.p2.y - self.p1.y;
        let len = (dx * dx + dy * dy).sqrt().max(1e-9);
        (dx / len, dy / len)
    }

    pub fn angle_deg(&self) -> f64 {
        (self.p2.y - self.p1.y).atan2(self.p2.x - self.p1.x) * 180.0 / PI
    }
}

/// 2D circle (`Delaire_BO.ModeleAnalyse.Cercle`).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Circle2D {
    pub center: Point2D,
    pub radius: f64,
}

/// Converts pixel distance to millimeters (`Delaire2010Fonctions.FromMM` / calibration scale).
/// `mm_per_pixel` is typically derived from DICOM `PixelSpacing` / `ImagerPixelSpacing` or ruler calibration.
pub fn px_to_mm(distance_px: f64, mm_per_pixel: f64) -> f64 {
    distance_px * mm_per_pixel
}

/// Converts millimeters to pixel distance (`Delaire2010Fonctions.ToMM`).
pub fn mm_to_px(distance_mm: f64, mm_per_pixel: f64) -> f64 {
    if mm_per_pixel.abs() < 1e-9 {
        distance_mm
    } else {
        distance_mm / mm_per_pixel
    }
}

/// Euclidean distance in pixels (`Delaire2010Fonctions.DistanceEnPxl`).
pub fn distance_px(a: Point2D, b: Point2D) -> f64 {
    ((b.x - a.x).powi(2) + (b.y - a.y).powi(2)).sqrt()
}

/// Euclidean distance in millimeters.
pub fn distance_mm(a: Point2D, b: Point2D, mm_per_pixel: f64) -> f64 {
    px_to_mm(distance_px(a, b), mm_per_pixel)
}

/// Angle in degrees [0, 180] formed at `vertex` by rays `vertex -> p1` and `vertex -> p2`.
/// Mirrors `Delaire2010Fonctions.Angle(PointF p1, PointF vertex, PointF p2)`.
pub fn angle_3pts(p1: Point2D, vertex: Point2D, p2: Point2D) -> f64 {
    let v1x = p1.x - vertex.x;
    let v1y = p1.y - vertex.y;
    let v2x = p2.x - vertex.x;
    let v2y = p2.y - vertex.y;
    let n1 = (v1x * v1x + v1y * v1y).sqrt();
    let n2 = (v2x * v2x + v2y * v2y).sqrt();
    if n1 < 1e-9 || n2 < 1e-9 {
        return 0.0;
    }
    let cos_theta = ((v1x * v2x + v1y * v2y) / (n1 * n2)).clamp(-1.0, 1.0);
    cos_theta.acos() * 180.0 / PI
}

/// Signed angle in degrees [-180, 180] from vector `a1 -> a2` to vector `b1 -> b2`.
pub fn signed_angle_4pts(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D) -> f64 {
    let ux = a2.x - a1.x;
    let uy = a2.y - a1.y;
    let vx = b2.x - b1.x;
    let vy = b2.y - b1.y;
    let dot = ux * vx + uy * vy;
    let cross = ux * vy - uy * vx;
    cross.atan2(dot) * 180.0 / PI
}

///Unsigned angle in degrees [0, 180] between two segments `(a1, a2)` and `(b1, b2)`.
/// Mirrors `Delaire2010Fonctions.Angle(PointF, PointF, PointF, PointF)` and `AngleEntre2PlanSegments`.
pub fn angle_4pts(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D) -> f64 {
    signed_angle_4pts(a1, a2, b1, b2).abs()
}

/// Acute/interior angle [0, 90] or supplementary angle between two planes.
pub fn acute_angle_4pts(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D) -> f64 {
    let a = angle_4pts(a1, a2, b1, b2);
    if a > 90.0 {
        180.0 - a
    } else {
        a
    }
}

/// Creates a line parallel to `origin` passing through `through` (`Delaire2010Fonctions.CreateDroiteParalleleA`).
pub fn create_line_parallel(origin: Line2D, through: Point2D) -> Line2D {
    let (dx, dy) = origin.direction();
    Line2D::from_points(through, Point2D::new(through.x + dx * 100.0, through.y + dy * 100.0))
}

/// Creates a line perpendicular to `origin` passing through `through` (`Delaire2010Fonctions.CreateDroitePerpendiculaireA`).
pub fn create_line_perpendicular(origin: Line2D, through: Point2D) -> Line2D {
    let (dx, dy) = origin.direction();
    Line2D::from_points(through, Point2D::new(through.x - dy * 100.0, through.y + dx * 100.0))
}

/// Orthogonal (90°) projection of `pt` onto line `line` (`Delaire2010Fonctions.Projection`).
pub fn projection_on_line(line: Line2D, pt: Point2D) -> Point2D {
    let vx = line.p2.x - line.p1.x;
    let vy = line.p2.y - line.p1.y;
    let len_sq = vx * vx + vy * vy;
    if len_sq < 1e-12 {
        return line.p1;
    }
    let t = ((pt.x - line.p1.x) * vx + (pt.y - line.p1.y) * vy) / len_sq;
    Point2D::new(line.p1.x + t * vx, line.p1.y + t * vy)
}

/// Signed perpendicular distance from `pt` to directed line `a -> b` in millimeters.
/// Positive when `pt` lies to the right/anterior of vector `a -> b` in standard lateral cephalogram orientation.
pub fn signed_distance_to_line_mm(a: Point2D, b: Point2D, pt: Point2D, mm_per_pixel: f64) -> f64 {
    let vx = b.x - a.x;
    let vy = b.y - a.y;
    let len = (vx * vx + vy * vy).sqrt();
    if len < 1e-9 {
        return 0.0;
    }
    // In screen coordinates (x right, y down), (b - a) from N(top) to Pog(bottom) has vy > 0.
    // A point anterior (larger x) yields (pt.x - a.x)*vy - (pt.y - a.y)*vx > 0.
    let cross = (pt.x - a.x) * vy - (pt.y - a.y) * vx;
    px_to_mm(cross / len, mm_per_pixel)
}

/// Mirror symmetry of `pt` across `line` (`Delaire2010Fonctions.Symetrie`).
pub fn symmetry_across_line(line: Line2D, pt: Point2D) -> Point2D {
    let proj = projection_on_line(line, pt);
    Point2D::new(2.0 * proj.x - pt.x, 2.0 * proj.y - pt.y)
}

/// Homothety / linear interpolation along segment `a -> b` by factor `ratio` (`Delaire2010Fonctions.Homotethie`).
pub fn homothetie(a: Point2D, b: Point2D, ratio: f64) -> Point2D {
    Point2D::new(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio)
}

/// Moves from `start` along `line` by `distance_px` toward `direction_hint` if provided (`Delaire2010Fonctions.ParcourirEnPxl`).
pub fn parcourir_px(
    line: Line2D,
    start: Point2D,
    distance_px: f64,
    direction_hint: Option<Point2D>,
) -> Point2D {
    let (mut dx, mut dy) = line.direction();
    if let Some(hint) = direction_hint {
        let hx = hint.x - start.x;
        let hy = hint.y - start.y;
        if hx * dx + hy * dy < 0.0 {
            dx = -dx;
            dy = -dy;
        }
    }
    Point2D::new(start.x + dx * distance_px, start.y + dy * distance_px)
}

/// Moves from `start` along `line` by `distance_mm` (`Delaire2010Fonctions.Parcourir`).
pub fn parcourir_mm(
    line: Line2D,
    start: Point2D,
    distance_mm: f64,
    mm_per_pixel: f64,
    direction_hint: Option<Point2D>,
) -> Point2D {
    let dist_px = mm_to_px(distance_mm, mm_per_pixel);
    parcourir_px(line, start, dist_px, direction_hint)
}

/// Intersection between two infinite lines `l1` and `l2` (`Delaire2010Fonctions.IntersectionDePlan`).
pub fn intersection_lines(l1: Line2D, l2: Line2D) -> Option<Point2D> {
    let x1 = l1.p1.x;
    let y1 = l1.p1.y;
    let x2 = l1.p2.x;
    let y2 = l1.p2.y;
    let x3 = l2.p1.x;
    let y3 = l2.p1.y;
    let x4 = l2.p2.x;
    let y4 = l2.p2.y;

    let denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if denom.abs() < 1e-10 {
        return None;
    }
    let px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
    let py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
    Some(Point2D::new(px, py))
}

/// Intersection of two circles (`Delaire2010Fonctions.IntersectionDeCercles`).
pub fn intersection_circles(c1: Circle2D, c2: Circle2D) -> Option<(Point2D, Point2D)> {
    let d = distance_px(c1.center, c2.center);
    if d > c1.radius + c2.radius || d < (c1.radius - c2.radius).abs() || d < 1e-9 {
        return None;
    }
    let a = (c1.radius.powi(2) - c2.radius.powi(2) + d.powi(2)) / (2.0 * d);
    let h = (c1.radius.powi(2) - a.powi(2)).max(0.0).sqrt();
    let x2 = c1.center.x + a * (c2.center.x - c1.center.x) / d;
    let y2 = c1.center.y + a * (c2.center.y - c1.center.y) / d;
    let rx = -(c2.center.y - c1.center.y) * (h / d);
    let ry = (c2.center.x - c1.center.x) * (h / d);
    Some((Point2D::new(x2 + rx, y2 + ry), Point2D::new(x2 - rx, y2 - ry)))
}

/// Centroid of a slice of points (`Delaire2010Fonctions.CentreDe` for 2..5 points).
pub fn centre_de(points: &[Point2D]) -> Option<Point2D> {
    if points.is_empty() {
        return None;
    }
    let (sx, sy) = points
        .iter()
        .fold((0.0, 0.0), |(ax, ay), p| (ax + p.x, ay + p.y));
    let n = points.len() as f64;
    Some(Point2D::new(sx / n, sy / n))
}

/// Point rotated around `origin` by `angle_deg` (`Delaire2010Fonctions.AngleAvec`).
pub fn angle_avec(origin: Point2D, reference: Point2D, angle_deg: f64) -> Point2D {
    let rad = angle_deg * PI / 180.0;
    let dx = reference.x - origin.x;
    let dy = reference.y - origin.y;
    Point2D::new(
        origin.x + dx * rad.cos() - dy * rad.sin(),
        origin.y + dx * rad.sin() + dy * rad.cos(),
    )
}
