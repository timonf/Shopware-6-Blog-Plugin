import template from './sw-cms-el-component-newest-listing.html.twig';
import './sw-cms-el-component-newest-listing.scss';

const { Component, Mixin } = Shopware;

Component.register('sas-cms-el-newest-listing', {
    template,

    mixins: [
        Mixin.getByName('cms-element')
    ],

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.initElementConfig('blog-newest-listing');
            this.initElementData('blog-newest-listing');
        },
    },
});
