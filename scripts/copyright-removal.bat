@echo off
echo Starting copyright content removal process...

echo.
echo Creating backup before removal...
if not exist "backups" mkdir backups
powershell Compress-Archive -Path "content\cartoons-coloring-pages\*", "content\superheroes-coloring-pages\*", "static\images\collections\*" -DestinationPath "backups\copyright-content-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.zip" -Force

echo.
echo Removing copyrighted content files...

rem Remove cartoons content
del "content\cartoons-coloring-pages\bluey-coloring-page.md"
del "content\cartoons-coloring-pages\stitch-coloring-page.md"
del "content\cartoons-coloring-pages\sonic-coloring-page.md"
del "content\cartoons-coloring-pages\hello-kitty-coloring-page.md"
del "content\cartoons-coloring-pages\paw-patrol-coloring-page.md"
del "content\cartoons-coloring-pages\winnie-the-pooh-coloring-page.md"

rem Remove superhero content
del "content\superheroes-coloring-pages\spider-man-coloring-page.md"
del "content\superheroes-coloring-pages\captain-america-coloring-page.md"
del "content\superheroes-coloring-pages\deadpool-coloring-page.md"

echo.
echo Removing associated image directories...

rem Remove image collections
if exist "static\images\collections\cartoons-coloring-pages\bluey-coloring-page" rmdir /s /q "static\images\collections\cartoons-coloring-pages\bluey-coloring-page"
if exist "static\images\collections\cartoons-coloring-pages\stitch-coloring-page" rmdir /s /q "static\images\collections\cartoons-coloring-pages\stitch-coloring-page"
if exist "static\images\collections\cartoons-coloring-pages\sonic-coloring-page" rmdir /s /q "static\images\collections\cartoons-coloring-pages\sonic-coloring-page"
if exist "static\images\collections\cartoons-coloring-pages\hello-kitty-coloring-page" rmdir /s /q "static\images\collections\cartoons-coloring-pages\hello-kitty-coloring-page"
if exist "static\images\collections\cartoons-coloring-pages\paw-patrol-coloring-page" rmdir /s /q "static\images\collections\cartoons-coloring-pages\paw-patrol-coloring-page"
if exist "static\images\collections\cartoons-coloring-pages\winnie-the-pooh-coloring-page" rmdir /s /q "static\images\collections\cartoons-coloring-pages\winnie-the-pooh-coloring-page"
if exist "static\images\collections\superheroes-coloring-pages\spider-man-coloring-page" rmdir /s /q "static\images\collections\superheroes-coloring-pages\spider-man-coloring-page"
if exist "static\images\collections\superheroes-coloring-pages\captain-america-coloring-page" rmdir /s /q "static\images\collections\superheroes-coloring-pages\captain-america-coloring-page"
if exist "static\images\collections\superheroes-coloring-pages\deadpool-coloring-page" rmdir /s /q "static\images\collections\superheroes-coloring-pages\deadpool-coloring-page"

echo.
echo Copyright content removal completed!
echo Backup saved to: backups\copyright-content-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.zip
echo.
echo Next steps:
echo 1. Clean Sanity.io manifest
echo 2. Update robots.txt
echo 3. Rebuild Hugo site
echo.