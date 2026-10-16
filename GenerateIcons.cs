using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class StockIconV11Final
{
    public static void Generate(string outputPath, int size)
    {
        using (Bitmap bmp = new Bitmap(1024, 1024, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;

            // 1. Dark Background Tile (Inverted stock icon background)
            using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                new Point(512, 0), new Point(512, 1024),
                Color.FromArgb(255, 38, 40, 44),
                Color.FromArgb(255, 17, 18, 20)))
            {
                g.FillRectangle(bgBrush, 0, 0, 1024, 1024);
            }

            // 2. Exact Stock-Proportional Calculator Body
            // 510x742 on 1024x1024, perfectly mirroring Apple's stock calculator
            float bodyW = 512f;
            float bodyH = 746f;
            float bodyX = (1024f - bodyW) / 2f; // 256f
            float bodyY = 136f;
            float bodyRadius = 112f; // Apple squircle corner radius

            // Multi-layered realistic ambient drop shadow
            for (int s = 1; s <= 14; s++)
            {
                float expand = s * 3.2f;
                int alpha = Math.Max(2, 42 - s * 3);
                RectangleF shadowRect = new RectangleF(
                    bodyX - expand * 0.45f,
                    bodyY + s * 3.8f,
                    bodyW + expand * 0.9f,
                    bodyH + expand * 0.45f);
                using (GraphicsPath sp = RoundedRect(shadowRect, bodyRadius + expand * 0.35f))
                using (SolidBrush sb = new SolidBrush(Color.FromArgb(alpha, 0, 0, 0)))
                {
                    g.FillPath(sb, sp);
                }
            }

            // Body Fill: Smooth light platinum gradient
            RectangleF bodyRect = new RectangleF(bodyX, bodyY, bodyW, bodyH);
            using (GraphicsPath bp = RoundedRect(bodyRect, bodyRadius))
            {
                using (LinearGradientBrush bodyBrush = new LinearGradientBrush(
                    new PointF(bodyX, bodyY), new PointF(bodyX, bodyY + bodyH),
                    Color.FromArgb(255, 252, 252, 254),
                    Color.FromArgb(255, 220, 222, 226)))
                {
                    g.FillPath(bodyBrush, bp);
                }

                // Liquid glass perimeter rim highlight (specular white top edge, 4px)
                using (Pen topRimPen = new Pen(Color.FromArgb(250, 255, 255, 255), 4.2f))
                {
                    topRimPen.Alignment = PenAlignment.Inset;
                    g.DrawPath(topRimPen, bp);
                }

                using (Pen subtleBevel = new Pen(Color.FromArgb(35, 0, 0, 0), 1.5f))
                {
                    subtleBevel.Alignment = PenAlignment.Inset;
                    g.DrawPath(subtleBevel, bp);
                }
            }

            // 3. Screen Dimensions & LCD
            // Measured from stock:
            // Side margin: 66px
            // Button diameter: 96px
            // Gap: 44px (strictly uniform!)
            // Screen width: 3 * 96 + 2 * 44 = 376px (perfectly flush with outer button columns)
            float margin = 68f;
            float btnDiam = 94f;
            float gap = 47f;
            float screenX = bodyX + margin;
            float screenW = 3f * btnDiam + 2f * gap; // 376px
            float screenY = bodyY + 62f;
            float screenH = 202f;
            float screenRadius = 28f;

            RectangleF screenRect = new RectangleF(screenX, screenY, screenW, screenH);
            using (GraphicsPath scp = RoundedRect(screenRect, screenRadius))
            {
                // LCD Screen: Deep obsidian charcoal for maximum wave contrast
                using (LinearGradientBrush scrBrush = new LinearGradientBrush(
                    new PointF(screenX, screenY), new PointF(screenX, screenY + screenH),
                    Color.FromArgb(255, 15, 17, 20),
                    Color.FromArgb(255, 8, 9, 11)))
                {
                    g.FillPath(scrBrush, scp);
                }

                // Inset LCD bezel shadow
                using (Pen innerBezel = new Pen(Color.FromArgb(200, 3, 4, 6), 3f))
                {
                    innerBezel.Alignment = PenAlignment.Inset;
                    g.DrawPath(innerBezel, scp);
                }

                // Clip for screen contents
                Region oldClip = g.Clip;
                g.SetClip(scp, CombineMode.Intersect);

                // Draw Vibrant Electric Blue Sine Wave
                int wavePointsCount = 200;
                PointF[] wavePoints = new PointF[wavePointsCount];
                float centerY = screenY + screenH * 0.50f;
                float amplitude = 60f;
                float startX = screenX - 10f;
                float endX = screenX + screenW + 10f;

                for (int i = 0; i < wavePointsCount; i++)
                {
                    float t = (float)i / (wavePointsCount - 1);
                    float x = startX + t * (endX - startX);
                    float angle = (float)((t * 1.12 - 0.06) * 2.0 * Math.PI);
                    float y = centerY - (float)Math.Sin(angle) * amplitude;
                    wavePoints[i] = new PointF(x, y);
                }

                // Multi-tier bloom & wave thickness for high visibility on home screen
                using (GraphicsPath wp = new GraphicsPath())
                {
                    wp.AddCurve(wavePoints);

                    // Outer cyan glow (bloom)
                    using (Pen glowPen = new Pen(Color.FromArgb(50, 10, 132, 255), 36f))
                    {
                        glowPen.StartCap = LineCap.Round;
                        glowPen.EndCap = LineCap.Round;
                        glowPen.LineJoin = LineJoin.Round;
                        g.DrawPath(glowPen, wp);
                    }
                    using (Pen glowPen2 = new Pen(Color.FromArgb(100, 10, 132, 255), 22f))
                    {
                        glowPen2.StartCap = LineCap.Round;
                        glowPen2.EndCap = LineCap.Round;
                        glowPen2.LineJoin = LineJoin.Round;
                        g.DrawPath(glowPen2, wp);
                    }
                    // Solid vibrant electric blue wave body (15px thick)
                    using (Pen bodyPen = new Pen(Color.FromArgb(255, 10, 132, 255), 15f))
                    {
                        bodyPen.StartCap = LineCap.Round;
                        bodyPen.EndCap = LineCap.Round;
                        bodyPen.LineJoin = LineJoin.Round;
                        g.DrawPath(bodyPen, wp);
                    }
                    // Bright electric cyan core (5.5px thick) for razor-sharp legibility
                    using (Pen corePen = new Pen(Color.FromArgb(245, 145, 230, 255), 5.5f))
                    {
                        corePen.StartCap = LineCap.Round;
                        corePen.EndCap = LineCap.Round;
                        corePen.LineJoin = LineJoin.Round;
                        g.DrawPath(corePen, wp);
                    }
                }

                // Subtle top glass reflection on LCD screen
                using (LinearGradientBrush sheen = new LinearGradientBrush(
                    new PointF(screenX, screenY), new PointF(screenX, screenY + screenH * 0.35f),
                    Color.FromArgb(30, 255, 255, 255),
                    Color.FromArgb(0, 255, 255, 255)))
                {
                    g.FillRectangle(sheen, screenX, screenY, screenW, screenH * 0.35f);
                }

                g.Clip = oldClip;

                // Screen outer glass rim highlight
                using (Pen screenRim = new Pen(Color.FromArgb(90, 255, 255, 255), 2f))
                {
                    screenRim.Alignment = PenAlignment.Outset;
                    g.DrawPath(screenRim, scp);
                }
            }

            // 4. Buttons (3 rows, 3 columns)
            // Stock screen-to-row1 spacing: 36px
            float startBtnY = bodyY + 62f + screenH + 36f; // 136 + 62 + 202 + 36 = 436f

            Color darkBtnTop = Color.FromArgb(255, 58, 60, 65);
            Color darkBtnBottom = Color.FromArgb(255, 34, 35, 38);

            Color blueBtnTop = Color.FromArgb(255, 26, 148, 255);
            Color blueBtnBottom = Color.FromArgb(255, 0, 106, 226);

            for (int row = 0; row < 3; row++)
            {
                for (int col = 0; col < 3; col++)
                {
                    float bx = bodyX + margin + col * (btnDiam + gap);
                    float by = startBtnY + row * (btnDiam + gap);
                    RectangleF bRect = new RectangleF(bx, by, btnDiam, btnDiam);

                    bool isBlue = (col == 2);

                    // Button drop shadow onto calculator body
                    using (SolidBrush bShadow = new SolidBrush(Color.FromArgb(36, 0, 0, 0)))
                    {
                        g.FillEllipse(bShadow, bx, by + 3.8f, btnDiam, btnDiam);
                    }

                    // Button base fill
                    Color topColor = isBlue ? blueBtnTop : darkBtnTop;
                    Color botColor = isBlue ? blueBtnBottom : darkBtnBottom;

                    using (LinearGradientBrush btnBrush = new LinearGradientBrush(
                        new PointF(bx, by), new PointF(bx, by + btnDiam),
                        topColor, botColor))
                    {
                        g.FillEllipse(btnBrush, bRect);
                    }

                    // Liquid Glass Rim Highlight: Specular crescent reflection along upper rim
                    // Apple's signature liquid glass look (4px thick for crisp visibility on Retina)
                    using (Pen rimPen = new Pen(
                        isBlue ? Color.FromArgb(230, 205, 245, 255) : Color.FromArgb(180, 255, 255, 255),
                        4f))
                    {
                        RectangleF arcRect = new RectangleF(bx + 1.8f, by + 1.8f, btnDiam - 3.6f, btnDiam - 3.6f);
                        g.DrawArc(rimPen, arcRect, 190, 160);
                    }

                    // Subtle lower ambient bounce reflection
                    using (Pen botBouncePen = new Pen(
                        isBlue ? Color.FromArgb(85, 130, 215, 255) : Color.FromArgb(50, 255, 255, 255),
                        2f))
                    {
                        RectangleF botArcRect = new RectangleF(bx + 2f, by + 2f, btnDiam - 4f, btnDiam - 4f);
                        g.DrawArc(botBouncePen, botArcRect, 10, 160);
                    }
                }
            }

            // High quality output scaling if size != 1024
            if (size == 1024)
            {
                bmp.Save(outputPath, ImageFormat.Png);
            }
            else
            {
                using (Bitmap scaled = new Bitmap(size, size, PixelFormat.Format32bppArgb))
                using (Graphics sg = Graphics.FromImage(scaled))
                {
                    sg.SmoothingMode = SmoothingMode.HighQuality;
                    sg.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    sg.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    sg.CompositingQuality = CompositingQuality.HighQuality;
                    sg.DrawImage(bmp, 0, 0, size, size);
                    scaled.Save(outputPath, ImageFormat.Png);
                }
            }
        }
    }

    private static GraphicsPath RoundedRect(RectangleF bounds, float radius)
    {
        float diameter = radius * 2f;
        GraphicsPath path = new GraphicsPath();
        path.AddArc(bounds.X, bounds.Y, diameter, diameter, 180, 90);
        path.AddArc(bounds.Right - diameter, bounds.Y, diameter, diameter, 270, 90);
        path.AddArc(bounds.Right - diameter, bounds.Bottom - diameter, diameter, diameter, 0, 90);
        path.AddArc(bounds.X, bounds.Bottom - diameter, diameter, diameter, 90, 90);
        path.CloseFigure();
        return path;
    }
}
