ALTER TABLE "Good" ADD COLUMN "individualPricePerSqm" INTEGER;
ALTER TABLE "Good" ADD COLUMN "individualFixedPrice" INTEGER;
ALTER TABLE "Good" ADD COLUMN "availableInExpress" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Good" ADD COLUMN "availableInIndividual" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Good"
SET
  "individualPricePerSqm" = "pricePerSqm",
  "individualFixedPrice" = "fixedPrice"
WHERE "individualPricePerSqm" IS NULL
  AND "individualFixedPrice" IS NULL;
