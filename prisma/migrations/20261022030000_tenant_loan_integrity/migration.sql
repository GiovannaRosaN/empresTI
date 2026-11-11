-- Prisma Migrate diff from the existing initial schema to the approved model.
ALTER TABLE "loans" DROP CONSTRAINT "loans_equipment_id_fkey";

DROP INDEX "equipments_asset_tag_key";

ALTER TABLE "loans" DROP COLUMN "status";

CREATE UNIQUE INDEX "equipments_tenant_id_asset_tag_key"
    ON "equipments"("tenant_id", "asset_tag");
CREATE UNIQUE INDEX "equipments_id_tenant_id_key"
    ON "equipments"("id", "tenant_id");
CREATE INDEX "loans_tenant_borrower_returned_idx"
    ON "loans"("tenant_id", "borrower_id", "returned_at");

ALTER TABLE "loans"
    ADD CONSTRAINT "loans_equipment_id_tenant_id_fkey"
    FOREIGN KEY ("equipment_id", "tenant_id")
    REFERENCES "equipments"("id", "tenant_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loans"
    ADD CONSTRAINT "loans_borrower_id_tenant_id_fkey"
    FOREIGN KEY ("borrower_id", "tenant_id")
    REFERENCES "memberships"("user_id", "tenant_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "loans_open_equipment_unique"
    ON "loans"("tenant_id", "equipment_id")
    WHERE "returned_at" IS NULL;

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
ALTER TABLE "equipments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenants_read_current_tenant
    ON "tenants" FOR SELECT
    USING ("id" = NULLIF(current_setting('app.tenant_id', true), ''));

CREATE POLICY memberships_read_current_user
    ON "memberships" FOR SELECT
    USING ("user_id" = NULLIF(current_setting('app.user_id', true), ''));

CREATE POLICY equipments_read_tenant
    ON "equipments" FOR SELECT
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), ''));
CREATE POLICY equipments_insert_admin
    ON "equipments" FOR INSERT
    WITH CHECK (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')
        AND current_setting('app.role', true) = 'ADMIN'
    );
CREATE POLICY equipments_update_admin
    ON "equipments" FOR UPDATE
    USING (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')
        AND current_setting('app.role', true) = 'ADMIN'
    )
    WITH CHECK (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')
        AND current_setting('app.role', true) = 'ADMIN'
    );

CREATE POLICY loans_read_tenant_scope
    ON "loans" FOR SELECT
    USING (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')
        AND (
            "borrower_id" = NULLIF(current_setting('app.user_id', true), '')
            OR current_setting('app.role', true) = 'ADMIN'
            OR current_setting('app.loan_read_scope', true) = 'equipment-availability'
        )
    );
CREATE POLICY loans_insert_borrower
    ON "loans" FOR INSERT
    WITH CHECK (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')
        AND "borrower_id" = NULLIF(current_setting('app.user_id', true), '')
        AND current_setting('app.role', true) = 'COLLABORATOR'
    );
CREATE POLICY loans_return_current_user_or_admin
    ON "loans" FOR UPDATE
    USING (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')
        AND (
            "borrower_id" = NULLIF(current_setting('app.user_id', true), '')
            OR current_setting('app.role', true) = 'ADMIN'
        )
    )
    WITH CHECK (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')
        AND (
            "borrower_id" = NULLIF(current_setting('app.user_id', true), '')
            OR current_setting('app.role', true) = 'ADMIN'
        )
    );

CREATE POLICY audit_logs_deny_user_access
    ON "audit_logs" FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE FUNCTION prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;

CREATE TRIGGER audit_logs_append_only
    BEFORE UPDATE OR DELETE ON "audit_logs"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_mutation();
