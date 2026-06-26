-- CreateEnum
CREATE TYPE "DeliveryZoneGeoType" AS ENUM ('RADIUS', 'POLYGON');

-- AlterTable
ALTER TABLE "DeliveryZone" ADD COLUMN     "centerLat" DOUBLE PRECISION,
ADD COLUMN     "centerLng" DOUBLE PRECISION,
ADD COLUMN     "geoType" "DeliveryZoneGeoType" NOT NULL DEFAULT 'RADIUS',
ADD COLUMN     "polygon" JSONB,
ADD COLUMN     "radiusKm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION;
