CREATE TABLE "location_points" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_points_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "location_points_job_id_recorded_at_idx"
    ON "location_points"("job_id", "recorded_at");
CREATE INDEX "location_points_tenant_id_job_id_recorded_at_idx"
    ON "location_points"("tenant_id", "job_id", "recorded_at");
CREATE INDEX "location_points_vehicle_id_recorded_at_idx"
    ON "location_points"("vehicle_id", "recorded_at");

CREATE TABLE "public_tracking_tokens" (
    "token_hash" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "public_tracking_tokens_pkey" PRIMARY KEY ("token_hash")
);

CREATE INDEX "public_tracking_tokens_tenant_id_job_id_idx"
    ON "public_tracking_tokens"("tenant_id", "job_id");
