Shopware.Mixin.register('sas-slug-generator', {
    methods: {
        generateNextSlug(slug) {
            return slug + '-' + '1';
        },

        generateSlugForCreatePage(entities, slug) {
            if (entities.length) {
                return this.generateNextSlug(slug);
            }
            return slug;
        },

        generateSlugForDetailsPage(entities, slug, originalSlug) {
            if (entities.length && entities[0]['slug'] !== originalSlug) {
                return this.generateNextSlug(slug);
            }
            return slug;
        },
    },
});
