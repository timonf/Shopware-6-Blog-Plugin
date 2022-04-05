import template from './sw-cms-sidebar.html.twig';
import BLOG from '../../../../constant/blog-module.constant';

Shopware.Component.override('sw-cms-sidebar', {
    template,

    computed: {
        isBlogDetail() {
            return this.page.type === BLOG.PAGE_TYPES.BLOG_DETAIL;
        },
    },
});
