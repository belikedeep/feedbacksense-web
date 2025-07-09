-- CreateTable: Export History for tracking all exports with metadata
CREATE TABLE "export_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "export_type" TEXT NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "file_path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "file_size" INTEGER,
    "record_count" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Export Templates for saving export configurations
CREATE TABLE "export_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usage_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "export_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Export Progress for real-time progress tracking
CREATE TABLE "export_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "export_id" UUID NOT NULL,
    "stage" TEXT NOT NULL,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_completion" TIMESTAMPTZ(6),

    CONSTRAINT "export_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Performance indexes for export_history
CREATE INDEX "export_history_user_id_idx" ON "export_history"("user_id");
CREATE INDEX "export_history_status_idx" ON "export_history"("status");
CREATE INDEX "export_history_created_at_idx" ON "export_history"("created_at");
CREATE INDEX "export_history_export_type_idx" ON "export_history"("export_type");

-- CreateIndex: Performance indexes for export_templates
CREATE INDEX "export_templates_user_id_idx" ON "export_templates"("user_id");
CREATE INDEX "export_templates_is_shared_idx" ON "export_templates"("is_shared");
CREATE INDEX "export_templates_is_default_idx" ON "export_templates"("is_default");
CREATE INDEX "export_templates_created_at_idx" ON "export_templates"("created_at");

-- CreateIndex: Performance indexes for export_progress
CREATE INDEX "export_progress_export_id_idx" ON "export_progress"("export_id");
CREATE INDEX "export_progress_stage_idx" ON "export_progress"("stage");
CREATE INDEX "export_progress_updated_at_idx" ON "export_progress"("updated_at");

-- AddForeignKey: Foreign key constraints
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "export_templates" ADD CONSTRAINT "export_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "export_progress" ADD CONSTRAINT "export_progress_export_id_fkey" FOREIGN KEY ("export_id") REFERENCES "export_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;