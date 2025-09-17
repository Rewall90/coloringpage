@echo off
echo Deleting ONLY copyrighted assets from Sanity.io...
echo.
echo The following 25 assets will be deleted:
echo - Hello Kitty: 2 assets
echo - Winnie the Pooh: 18 assets
echo - Paw Patrol: 1 asset
echo - Stitch: 1 asset
echo - Bluey: 1 asset
echo - Sonic: 2 assets
echo.

cd sanity

echo Deleting Hello Kitty assets...
npx sanity documents delete image-07a99129edd11e413c12da7d3407ec6783d7479f-1312x736-webp --dataset production
npx sanity documents delete image-cfd0b26350488dd0c550bc93e8779bd511df0490-750x1000-webp --dataset production

echo Deleting Winnie the Pooh assets...
npx sanity documents delete image-1e9e5289cf62d1247564c6350c563113b85decd3-1312x656-webp --dataset production
npx sanity documents delete image-3f8e584c4d3c207ae5528f56d93db941dcb10552-1312x736-png --dataset production
npx sanity documents delete image-434f4b65d9989f25b4922be3a7074caca5365c0b-1312x656-webp --dataset production
npx sanity documents delete image-4567e7cf2597e93000aac15c068f62ea631c6ea1-1312x656-webp --dataset production
npx sanity documents delete image-4e31273acc5e662e262db9ef9f0e5991ccbf8e46-1312x656-webp --dataset production
npx sanity documents delete image-4fb8e97574a929b1563a5bb372b2a0b9a15e52eb-1312x656-png --dataset production
npx sanity documents delete image-5a55382f5e846d78ac4d6781af81b50d48160ac5-1312x656-webp --dataset production
npx sanity documents delete image-69099bc8d09cd4399de7e5f191c7852065964339-1312x656-webp --dataset production
npx sanity documents delete image-74d241ba301d6e491d56777878fbc56dd4e9bd62-1312x656-webp --dataset production
npx sanity documents delete image-8d5f65f202a1bc088ea845913bacf3dc5a681a30-1312x656-webp --dataset production
npx sanity documents delete image-99943206f838fa780798126c40f2a0a5e7497d86-1312x656-webp --dataset production
npx sanity documents delete image-99cc34509e263ebcaec6ac7953cae8b2d1a1945f-1312x656-webp --dataset production
npx sanity documents delete image-a80aeb89291efda1f3675f8602f47ec1b81fa072-1312x656-webp --dataset production
npx sanity documents delete image-c67fad7023a9d35037e9096838d0fdc040e4a0bc-1312x656-webp --dataset production
npx sanity documents delete image-dd2c66b7aa34912c8018ff815249ec7b7cc8d017-1312x656-webp --dataset production
npx sanity documents delete image-e0b756d9021db09925bb19f53e7178bd21448cf7-1312x656-webp --dataset production
npx sanity documents delete image-f37295d09e4091b5a846b78ed4fe1ad34ba14cac-1312x656-webp --dataset production
npx sanity documents delete image-fae0d15fd0e45056d4705bf796a46ccf3eddf793-1312x656-webp --dataset production

echo Deleting Paw Patrol assets...
npx sanity documents delete image-3c825ff6a1e277d6d534786c1e18f0de387508c7-1312x656-png --dataset production

echo Deleting Stitch assets...
npx sanity documents delete image-ab118024d7dfb5a78592404196fcf27440df5277-1312x656-png --dataset production

echo Deleting Bluey assets...
npx sanity documents delete image-d5a6345def8238da807b123953bc817b566c516a-1312x736-png --dataset production

echo Deleting Sonic assets...
npx sanity documents delete image-f52c6b9c6d45544b82c22d0b8824157b6a943f06-1312x736-heif --dataset production
npx sanity documents delete image-fff189dd721960afa81a0ca50bb817be4e0860c3-1312x656-png --dataset production

echo.
echo Copyrighted asset deletion completed!
echo Only copyrighted character assets have been removed.
echo All other content remains untouched.