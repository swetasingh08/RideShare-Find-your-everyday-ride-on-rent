Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$workspace = 'C:\Users\sweta\OneDrive\Desktop\RideShare'
$output = Join-Path $workspace 'RideShare_seamless_workflow_collage.png'
$homeShot = 'C:\Users\sweta\AppData\Local\Temp\codex-clipboard-1b3d67db-b90b-455b-aaec-7d8db5e7163b.png'
$ownerShot = 'C:\Users\sweta\AppData\Local\Temp\codex-clipboard-52339783-b093-4df9-8d45-da9ea54f6a68.png'
$bookingShot = 'C:\Users\sweta\AppData\Local\Temp\codex-clipboard-ca5d6227-7f2f-458b-abe2-f28cd8d2a418.png'
$vehiclesShot = 'C:\Users\sweta\AppData\Local\Temp\codex-clipboard-c1f3baf1-9a04-458d-ac6a-9d69d3e554a2.png'

$W = 2200; $H = 1500
$bmp = New-Object Drawing.Bitmap $W, $H
$g = [Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bg = [Drawing.Color]::FromArgb(246,250,249)
$ink = [Drawing.Color]::FromArgb(18,32,51)
$muted = [Drawing.Color]::FromArgb(88,108,132)
$teal = [Drawing.Color]::FromArgb(13,126,117)
$tealDark = [Drawing.Color]::FromArgb(7,96,91)
$tealLight = [Drawing.Color]::FromArgb(226,242,239)
$line = [Drawing.Color]::FromArgb(205,224,219)
$white = [Drawing.Color]::White
$red = [Drawing.Color]::FromArgb(198,62,62)
$redLight = [Drawing.Color]::FromArgb(255,238,238)
$green = [Drawing.Color]::FromArgb(35,148,103)
$greenLight = [Drawing.Color]::FromArgb(229,246,237)
$amber = [Drawing.Color]::FromArgb(211,137,33)
$amberLight = [Drawing.Color]::FromArgb(255,246,222)

$g.Clear($bg)

function F($size, $style = [Drawing.FontStyle]::Regular) { return New-Object Drawing.Font('Segoe UI', $size, $style) }
function PathRound($x,$y,$w,$h,$r) {
    $p = New-Object Drawing.Drawing2D.GraphicsPath; $d = 2*$r
    $p.AddArc($x,$y,$d,$d,180,90); $p.AddArc($x+$w-$d,$y,$d,$d,270,90)
    $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90); $p.AddArc($x,$y+$h-$d,$d,$d,90,90)
    $p.CloseFigure(); return $p
}
function FillR($x,$y,$w,$h,$r,$c) { $b=New-Object Drawing.SolidBrush($c);$p=PathRound $x $y $w $h $r;$g.FillPath($b,$p);$b.Dispose();$p.Dispose() }
function StrokeR($x,$y,$w,$h,$r,$c,$width=1) { $p=New-Object Drawing.Pen($c,$width);$q=PathRound $x $y $w $h $r;$g.DrawPath($p,$q);$p.Dispose();$q.Dispose() }
function T($s,$x,$y,$w,$h,$size,$c,$style=[Drawing.FontStyle]::Regular) { $b=New-Object Drawing.SolidBrush($c);$font=F $size $style;$fmt=New-Object Drawing.StringFormat;$fmt.Trimming=[Drawing.StringTrimming]::EllipsisCharacter;$g.DrawString($s,$font,$b,(New-Object Drawing.RectangleF($x,$y,$w,$h)),$fmt);$font.Dispose();$b.Dispose();$fmt.Dispose() }
function Line($x1,$y1,$x2,$y2,$c,$width=1) { $p=New-Object Drawing.Pen($c,$width);$g.DrawLine($p,$x1,$y1,$x2,$y2);$p.Dispose() }
function DotArrow($points) { $p=New-Object Drawing.Pen($teal,$2);$p.Width=2;$p.DashStyle=[Drawing.Drawing2D.DashStyle]::Dot;$p.EndCap=[Drawing.Drawing2D.LineCap]::ArrowAnchor;$g.DrawLines($p,$points);$p.Dispose() }
function Panel($x,$y,$w,$h,$num,$title,$caption) {
    FillR ($x+6) ($y+7) $w $h 14 ([Drawing.Color]::FromArgb(224,235,231)); FillR $x $y $w $h 14 $white
    FillR ($x+16) ($y+13) 28 28 14 $teal; T $num ($x+16) ($y+17) 28 17 11 $white ([Drawing.FontStyle]::Bold)
    T $title ($x+54) ($y+13) ($w-76) 26 15 $ink ([Drawing.FontStyle]::Bold)
    T $caption ($x+12) ($y+$h+13) ($w-24) 24 13 $ink ([Drawing.FontStyle]::Regular)
}
function Screenshot($path,$x,$y,$w,$h) {
    $im=[Drawing.Image]::FromFile($path);$scale=[Math]::Min($w/$im.Width,$h/$im.Height);$dw=[int]($im.Width*$scale);$dh=[int]($im.Height*$scale);$dx=[int]($x+(($w-$dw)/2));$dy=[int]($y+(($h-$dh)/2));$g.DrawImage($im,$dx,$dy,$dw,$dh);$im.Dispose()
}
function Pill($s,$x,$y,$w,$color,$textColor) { FillR $x $y $w 22 11 $color; T $s ($x+8) ($y+5) ($w-16) 15 10 $textColor ([Drawing.FontStyle]::Bold) }
function MiniCard($x,$y,$w,$title,$value,$detail,$accent) {
    FillR $x $y $w 78 10 $white; StrokeR $x $y $w 78 10 $line 1
    T $title ($x+12) ($y+10) ($w-24) 16 10 $muted
    T $value ($x+12) ($y+29) ($w-24) 25 17 $accent ([Drawing.FontStyle]::Bold)
    T $detail ($x+12) ($y+57) ($w-24) 14 9 $muted
}
function VehicleCard($x,$y,$w,$name,$type,$price,$colorName) {
    FillR $x $y $w 162 10 $white; StrokeR $x $y $w 162 10 $line 1
    FillR ($x+10) ($y+10) ($w-20) 62 8 ([Drawing.Color]::FromArgb(237,245,243))
    FillR ($x+26) ($y+28) 80 26 13 ([Drawing.Color]::FromArgb(205,227,222))
    FillR ($x+46) ($y+19) 38 12 5 ([Drawing.Color]::FromArgb(205,227,222))
    Line ($x+20) ($y+57) ($x+112) ($y+57) $teal 3
    T $name ($x+12) ($y+80) ($w-24) 18 12 $ink ([Drawing.FontStyle]::Bold)
    T $type ($x+12) ($y+101) ($w-24) 15 10 $muted
    T $price ($x+12) ($y+125) ($w-80) 20 12 $teal ([Drawing.FontStyle]::Bold)
    Pill 'Available' ($x+$w-92) ($y+124) 80 $greenLight $green
}

# Header
T 'RideShare App - Seamless Workflow Collage' 0 30 $W 42 27 $ink ([Drawing.FontStyle]::Bold)
T 'Public discovery, vehicle selection, booking, owner management, and validation' 0 76 $W 25 14 $muted
FillR 1810 37 350 44 15 $tealLight; T 'ILLUSTRATIVE SAMPLE DATA' 1840 51 290 18 11 $teal ([Drawing.FontStyle]::Bold)

$pw=680; $ph=400; $x1=30; $x2=760; $x3=1490; $yt=132; $yb=765

# 1 Home / search screenshot
Panel $x1 $yt $pw $ph '1' 'Public user searches for a vehicle' 'Step 1: Public user searches for a vehicle'
Screenshot $homeShot ($x1+10) ($yt+48) ($pw-20) ($ph-58)

# 2 Vehicle listing: actual search screen plus populated cards
Panel $x2 $yt $pw $ph '2' 'User discovers available vehicle options' 'Step 2: User discovers available vehicle options'
Screenshot $vehiclesShot ($x2+10) ($yt+48) ($pw-20) 184
$cardsY=$yt+232
VehicleCard ($x2+24) $cardsY 198 'Hyundai Creta' 'SUV  |  Automatic' 'INR 1,200/day' 'Silver'
VehicleCard ($x2+241) $cardsY 198 'Honda City' 'Sedan  |  Automatic' 'INR 1,000/day' 'White'
VehicleCard ($x2+458) $cardsY 198 'Mahindra Thar' 'SUV  |  Manual' 'INR 1,600/day' 'Red'

# 3 Detail and map screen drawn in the same UI system
Panel $x3 $yt $pw $ph '+' 'Vehicle detail and location' 'Step 3: User views details and location'
$cx=$x3+18; $cy=$yt+52
FillR $cx $cy 306 330 12 $white; StrokeR $cx $cy 306 330 12 $line 1
FillR ($cx+12) ($cy+12) 282 126 9 ([Drawing.Color]::FromArgb(237,245,243))
FillR ($cx+70) ($cy+67) 150 36 18 ([Drawing.Color]::FromArgb(195,218,213)); Line ($cx+58) ($cy+106) ($cx+232) ($cy+106) $teal 4
T 'Mahindra Thar (Red)' ($cx+16) ($cy+152) 270 22 15 $ink ([Drawing.FontStyle]::Bold)
T 'SUV  |  Manual  |  5 seats' ($cx+16) ($cy+179) 270 18 11 $muted
T 'INR 1,600/day' ($cx+16) ($cy+214) 180 24 16 $teal ([Drawing.FontStyle]::Bold)
Pill 'Available' ($cx+198) ($cy+214) 92 $greenLight $green
Line ($cx+16) ($cy+253) ($cx+290) ($cy+253) $line 1
T 'Pickup area' ($cx+16) ($cy+267) 110 16 10 $muted; T 'Kakadeo, Kanpur' ($cx+130) ($cy+267) 150 16 10 $ink ([Drawing.FontStyle]::Bold)
T 'Trip protection included' ($cx+16) ($cy+293) 250 16 10 $green ([Drawing.FontStyle]::Bold)
$mapX=$x3+340; $mapY=$yt+52; $mapW=322; $mapH=330
FillR $mapX $mapY $mapW $mapH 12 ([Drawing.Color]::FromArgb(235,246,243)); StrokeR $mapX $mapY $mapW $mapH 12 $line 1
for($i=0;$i -lt 8;$i++){Line ($mapX+10) ($mapY+28+($i*34)) ($mapX+$mapW-10) ($mapY+6+($i*34)) ([Drawing.Color]::FromArgb(204,226,220)) 2}
for($i=0;$i -lt 5;$i++){Line ($mapX+50+($i*68)) ($mapY+8) ($mapX+15+($i*68)) ($mapY+$mapH-12) ([Drawing.Color]::FromArgb(204,226,220)) 2}
$rp=New-Object Drawing.Pen($teal,5);$rp.StartCap=[Drawing.Drawing2D.LineCap]::Round;$rp.EndCap=[Drawing.Drawing2D.LineCap]::Round;$pts=[Drawing.PointF[]]@([Drawing.PointF]::new(($mapX+55),($mapY+245)),[Drawing.PointF]::new(($mapX+125),($mapY+185)),[Drawing.PointF]::new(($mapX+195),($mapY+205)),[Drawing.PointF]::new(($mapX+265),($mapY+92)));$g.DrawLines($rp,$pts);$rp.Dispose()
$pb=New-Object Drawing.SolidBrush($teal);$g.FillEllipse($pb,($mapX+45),($mapY+235),20,20);$g.FillEllipse($pb,($mapX+255),($mapY+82),20,20);$pb.Dispose()
T 'Pickup' ($mapX+20) ($mapY+270) 80 16 10 $ink ([Drawing.FontStyle]::Bold);T 'Drop-off' ($mapX+235) ($mapY+111) 80 16 10 $ink ([Drawing.FontStyle]::Bold);T 'Location data is simulated' ($mapX+22) ($mapY+302) 270 18 10 $amber ([Drawing.FontStyle]::Bold)

# 4 Customer bookings screenshot with populated booking cards
Panel $x1 $yb $pw $ph '5' 'Renter manages bookings and trips' 'Step 5 (Renter): Renter manages bookings and trips'
Screenshot $bookingShot ($x1+10) ($yb+48) ($pw-20) 170
$by=$yb+230
FillR ($x1+56) $by 568 66 10 $white; StrokeR ($x1+56) $by 568 66 10 $line 1
T 'Booking RS1042' ($x1+72) ($by+12) 130 18 11 $ink ([Drawing.FontStyle]::Bold); T 'Mahindra Thar' ($x1+235) ($by+12) 130 18 11 $muted; T '12 Mar - 14 Mar' ($x1+388) ($by+12) 140 18 11 $muted; Pill 'Confirmed' ($x1+500) ($by+10) 95 $greenLight $green; T 'Pickup: Kakadeo, Kanpur  |  INR 3,200' ($x1+72) ($by+37) 360 17 10 $muted
FillR ($x1+56) ($by+76) 568 66 10 $white; StrokeR ($x1+56) ($by+76) 568 66 10 $line 1
T 'Booking RS1038' ($x1+72) ($by+88) 130 18 11 $ink ([Drawing.FontStyle]::Bold); T 'Honda City' ($x1+235) ($by+88) 130 18 11 $muted; T '05 Mar - 06 Mar' ($x1+388) ($by+88) 140 18 11 $muted; Pill 'Completed' ($x1+500) ($by+86) 95 $tealLight $teal; T 'Pickup: Civil Lines, Kanpur  |  INR 1,000' ($x1+72) ($by+113) 360 17 10 $muted

# 4 Owner dashboard, built as an enlarged populated state in the app style
Panel $x2 $yb $pw $ph '4' 'Owner manages listings and tracks revenue' 'Step 4 (Owner): Owner manages listings and tracks revenue'
FillR ($x2+18) ($yb+50) 644 334 10 ([Drawing.Color]::FromArgb(248,252,251)); StrokeR ($x2+18) ($yb+50) 644 334 10 $line 1
T 'Owner Workspace - Riya Singh dashboard' ($x2+38) ($yb+70) 500 24 17 $ink ([Drawing.FontStyle]::Bold)
T 'Manage your vehicles, booking requests, and rental activity.' ($x2+38) ($yb+98) 520 18 11 $muted
MiniCard ($x2+38) ($yb+130) 180 'Total vehicles' '2' 'Both available' $teal
MiniCard ($x2+250) ($yb+130) 180 'Total bookings' '13' '3 active today' $green
MiniCard ($x2+462) ($yb+130) 162 'Confirmed revenue' 'INR 11,600' 'This month' $amber
T 'Recent bookings' ($x2+38) ($yb+230) 240 22 14 $ink ([Drawing.FontStyle]::Bold)
Line ($x2+38) ($yb+260) ($x2+624) ($yb+260) $line 1
T 'Customer' ($x2+38) ($yb+270) 120 16 10 $muted;T 'Vehicle' ($x2+184) ($yb+270) 120 16 10 $muted;T 'Amount' ($x2+364) ($yb+270) 110 16 10 $muted;T 'Status' ($x2+500) ($yb+270) 100 16 10 $muted
T 'Aarav Mehta' ($x2+38) ($yb+300) 125 16 10 $ink;T 'Honda City' ($x2+184) ($yb+300) 130 16 10 $muted;T 'INR 2,000' ($x2+364) ($yb+300) 100 16 10 $ink;Pill 'Confirmed' ($x2+484) ($yb+296) 104 $greenLight $green
T 'Neha Verma' ($x2+38) ($yb+327) 125 16 10 $ink;T 'Mahindra Thar' ($x2+184) ($yb+327) 130 16 10 $muted;T 'INR 3,200' ($x2+364) ($yb+327) 100 16 10 $ink;Pill 'Pending' ($x2+500) ($yb+323) 88 $amberLight $amber

# 6 Form and validation state
Panel $x3 $yb $pw $ph '+' 'Clear error handling and responsive forms' 'Clear error handling and responsive forms'
FillR ($x3+38) ($yb+52) 604 320 14 ([Drawing.Color]::FromArgb(239,247,245)); StrokeR ($x3+38) ($yb+52) 604 320 14 $line 1
FillR ($x3+116) ($yb+78) 440 270 12 $white; StrokeR ($x3+116) ($yb+78) 440 270 12 $line 1
T 'Edit Vehicle Listing' ($x3+138) ($yb+97) 300 24 16 $ink ([Drawing.FontStyle]::Bold); T 'X' ($x3+520) ($yb+99) 20 20 14 $muted
T 'Form name *' ($x3+138) ($yb+139) 150 16 10 $muted; FillR ($x3+138) ($yb+158) 396 31 6 ([Drawing.Color]::FromArgb(249,252,251)); StrokeR ($x3+138) ($yb+158) 396 31 6 $line 1; T 'Mahindra Thar (Red)' ($x3+150) ($yb+166) 350 16 11 $ink
T 'Price per day *' ($x3+138) ($yb+205) 150 16 10 $muted; FillR ($x3+138) ($yb+224) 396 31 6 $redLight; StrokeR ($x3+138) ($yb+224) 396 31 6 $red 1; T '0' ($x3+150) ($yb+232) 350 16 11 $ink
FillR ($x3+508) ($yb+230) 18 18 9 $red; T '!' ($x3+513) ($yb+232) 10 12 10 $white ([Drawing.FontStyle]::Bold)
T 'Enter a valid positive number.' ($x3+138) ($yb+260) 300 17 10 $red ([Drawing.FontStyle]::Bold)
T 'Server-validated error shown near the source field' ($x3+138) ($yb+291) 380 16 10 $muted

# Flow connectors, placed between panels like the reference storyboard.
$d1=[Drawing.PointF[]]@([Drawing.PointF]::new(($x1+$pw),($yt+205)),[Drawing.PointF]::new(($x1+$pw+34),($yt+205)),[Drawing.PointF]::new(($x2-34),($yt+205)),[Drawing.PointF]::new($x2,($yt+205)))
$d2=[Drawing.PointF[]]@([Drawing.PointF]::new(($x2+$pw),($yt+205)),[Drawing.PointF]::new(($x2+$pw+34),($yt+205)),[Drawing.PointF]::new(($x3-34),($yt+205)),[Drawing.PointF]::new($x3,($yt+205)))
$d3=[Drawing.PointF[]]@([Drawing.PointF]::new(($x3+($pw/2)),($yt+$ph)),[Drawing.PointF]::new(($x3+($pw/2)),($yb-32)),[Drawing.PointF]::new(($x2+$pw-40),($yb-32)),[Drawing.PointF]::new(($x2+$pw-40),$yb))
$d4=[Drawing.PointF[]]@([Drawing.PointF]::new($x2,$yb+205),[Drawing.PointF]::new(($x2-34),($yb+205)),[Drawing.PointF]::new(($x1+$pw+34),($yb+205)),[Drawing.PointF]::new(($x1+$pw),($yb+205)))
foreach($d in @($d1,$d2,$d3,$d4)){ $p=New-Object Drawing.Pen($teal,2);$p.DashStyle=[Drawing.Drawing2D.DashStyle]::Dot;$p.EndCap=[Drawing.Drawing2D.LineCap]::ArrowAnchor;$g.DrawLines($p,$d);$p.Dispose() }

FillR 30 1400 2140 58 12 $tealLight
T 'Final accessibility and usability testing should be completed on the deployed interface.' 60 1419 2080 20 13 $tealDark ([Drawing.FontStyle]::Bold)
T 'Illustrative values shown for project presentation; live values depend on connected records.' 60 1465 2080 18 10 $muted

$bmp.Save($output,[Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$bmp.Dispose()
Write-Output $output
