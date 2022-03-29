import template from './sas-blog-detail.html.twig';
import BLOG from '../../constant/blog-module.constant';

import slugify from '@slugify';

const { Component, Mixin } = Shopware;
const { Criteria } = Shopware.Data;
const { debounce } = Shopware.Utils;
const { cloneDeep } = Shopware.Utils.object;
const { ShopwareError } = Shopware.Classes;
const debounceTimeout = 300;

Component.extend('sas-blog-detail', 'sw-cms-detail', {
    template,

    inject: [
        'repositoryFactory',
    ],

    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('sas-slug-generator'),
    ],

    data() {
        return {
            blogId: null,
            blog: null,
            slugBlog: null,
            isLoading: false,
            localeLanguage: null,
            showSectionModal: false,
            sectionDontRemind: false,
        };
    },

    computed: {
        identifier() {
            return this.placeholder(this.blog, 'title');
        },

        blogRepository() {
            return this.repositoryFactory.create('sas_blog_entries');
        },

        localeRepository() {
            return this.repositoryFactory.create('locale');
        },

        loadBlogCriteria() {
            const criteria = new Criteria(1, 1);
            const sortCriteria = Criteria.sort('position', 'ASC', true);

            criteria
                .addAssociation('blogCategories')

                .getAssociation('cmsPage')
                .getAssociation('sections')
                .addSorting(sortCriteria)
                .addAssociation('backgroundMedia')

                .getAssociation('blocks')
                .addSorting(sortCriteria)
                .addAssociation('backgroundMedia')
                .addAssociation('slots');

            return criteria;
        },

        backPath() {
            if (this.$route.query.ids && this.$route.query.ids.length > 0) {
                return {
                    name: 'blog.module.index',
                    query: {
                        ids: this.$route.query.ids,
                        limit: this.$route.query.limit,
                        page: this.$route.query.page,
                    },
                };
            }
            return { name: 'blog.module.index' };
        },

        isCreateMode() {
            return this.$route.name === 'blog.module.create';
        },
    },

    watch: {
        'blog.title': function (blogTitle) {
            this.onBlogTitleChanged(blogTitle);
        },
    },

    methods: {
        async createdComponent() {
            Shopware.State.commit('adminMenu/collapseSidebar');

            const isSystemDefaultLanguage = Shopware.State.getters['context/isSystemDefaultLanguage'];
            this.$store.commit('cmsPageState/setIsSystemDefaultLanguage', isSystemDefaultLanguage);

            this.resetCmsPageState();

            if (this.$route.params.id) {
                this.isLoading = true;
                this.blogId = this.$route.params.id;

                await this.loadBlog(this.blogId);
            }

            this.setPageContext();
        },

        loadBlog(blogId) {
            this.isLoading = true;

            return this.blogRepository.get(blogId, Shopware.Context.api, this.loadBlogCriteria).then((entity) => {
                this.blog = entity;
                this.slugBlog = entity.slug;

                if (entity.cmsPageId) {
                    this.page = entity.cmsPage;
                    this.pageId = entity.cmsPageId;
                    delete this.blog.cmsPage;
                    return this.loadCMSDataResolver();
                } else {
                    this.isLoading = false;
                    this.createPage(entity.title);
                    this.blog.cmsPageId = this.page.id;
                    this.blogId = entity.id;
                    return Promise.resolve();
                }
            }).catch((exception) => {
                this.isLoading = false;
                this.createNotificationError({
                    title: exception.message, message: exception.response,
                });
            });
        },

        onPageSave(debounced = false) {
            this.onPageUpdate();

            if (debounced) {
                this.debouncedPageSave();
                return;
            }

            this.onSaveBlog();
        },

        addAdditionalSection(type, index) {
            if (!this.blogIsValid()) {
                this.createNotificationError({
                    message: this.$tc('sw-cms.detail.notification.pageInvalid'),
                });

                this.$nextTick(() => {
                    if (this.$refs.cmsStageAddSection) {
                        this.$refs.cmsStageAddSection.showSelection = true;
                    }
                });

                return Promise.reject();
            }

            this.onAddSection(type, index);
            return this.onSaveBlog();
        },

        async onChangeLanguage() {
            this.isLoading = true;

            return this.salesChannelRepository.search(new Criteria()).then((response) => {
                this.salesChannels = response;
                const isSystemDefaultLanguage = Shopware.State.getters['context/isSystemDefaultLanguage'];
                this.$store.commit('cmsPageState/setIsSystemDefaultLanguage', isSystemDefaultLanguage);
                return this.loadBlog(this.blogId);
            });
        },

        saveOnLanguageChange() {
            return this.onSaveBlog();
        },

        loadCMSDataResolver() {
            this.isLoading = true;

            return this.cmsDataResolverService.resolve(this.page).then(() => {
                this.updateSectionAndBlockPositions();
                Shopware.State.commit('cmsPageState/setCurrentPage', this.page);

                this.updateDataMapping();
                this.pageOrigin = cloneDeep(this.page);

                if (this.selectedBlock) {
                    const blockId = this.selectedBlock.id;
                    const blockSectionId = this.selectedBlock.sectionId;
                    this.page.sections.forEach((section) => {
                        if (section.id === blockSectionId) {
                            section.blocks.forEach((block) => {
                                if (block.id === blockId) {
                                    this.setSelectedBlock(blockSectionId, block);
                                }
                            });
                        }
                    });
                }

                this.isLoading = false;
            }).catch((exception) => {
                this.isLoading = false;

                this.createNotificationError({
                    title: exception.message,
                    message: exception.response,
                });

                warn(this._name, exception.message, exception.response);
            });
        },

        onSaveBlog() {
            if (!this.blogIsValid()) {
                this.createNotificationError({
                    message: this.$tc('sw-cms.detail.notification.pageInvalid'),
                });

                return Promise.reject();
            }

            if (!this.pageIsValid()) {
                this.createNotificationError({
                    message: this.$tc('sw-cms.detail.notification.pageInvalid'),
                });

                return Promise.reject();
            }

            if (this.showMissingElementModal) {
                return Promise.reject();
            }

            return this.onSavePageEntity()
                .then(() => this.onSaveBlogEntity())
                .then(() => this.loadBlog(this.blogId))
                .catch(exception => {
                    this.isLoading = false;

                    this.createNotificationError({
                        message: exception.message,
                    });

                    return Promise.reject(exception);
                });
        },

        onSaveBlogEntity() {
            this.isLoading = true;

            return this.blogRepository.save(this.blog, Shopware.Context.api).then(() => {
                this.isLoading = false;
                this.$router.push({ name: 'blog.module.detail', params: { id: this.blog.id } });

                return Promise.resolve();
            }).catch(exception => {
                this.isLoading = false;

                this.createNotificationError({
                    message: exception.message,
                });

                return Promise.reject(exception);
            });
        },

        onSavePageEntity() {
            this.isLoading = true;
            this.deleteEntityAndRequiredConfigKey(this.page.sections);

            return this.pageRepository.save(this.page, Shopware.Context.api, false).then(() => {
                this.isLoading = false;
                this.isSaveSuccessful = true;

                return Promise.resolve();
            }).catch((exception) => {
                this.isLoading = false;

                this.createNotificationError({
                    message: exception.message,
                });

                return Promise.reject(exception);
            });
        },

        blogIsValid() {
            Shopware.State.dispatch('error/resetApiErrors');

            return [
                this.missingTitleValidation(),
                this.missingPublishedAtValidation(),
                this.missingAuthorIdValidation(),
                this.missingCategoriesValidation(),
            ].every(validation => validation);
        },

        missingTitleValidation() {
            if (!this.isSystemDefaultLanguage || this.blog.title) {
                return true;
            }

            this.addBlogError({
                property: 'title',
                message: this.$tc('sw-cms.detail.notification.messageMissingFields'),
            });

            return false;
        },

        missingPublishedAtValidation() {
            if (this.blog.publishedAt) {
                return true;
            }

            this.addBlogError({
                property: 'publishedAt',
                message: this.$tc('sw-cms.detail.notification.messageMissingFields'),
            });

            return false;
        },

        missingAuthorIdValidation() {
            if (this.blog.authorId) {
                return true;
            }

            this.addBlogError({
                property: 'authorId',
                message: this.$tc('sw-cms.detail.notification.messageMissingFields'),
            });

            return false;
        },

        missingCategoriesValidation() {
            if (this.blog.blogCategories && this.blog.blogCategories.length) {
                return true;
            }

            this.addBlogError({
                property: 'blogCategories',
                message: this.$tc('sw-cms.detail.notification.messageMissingFields'),
            });

            return false;
        },

        pageSectionCountValidation() {
            return true;
        },

        onBlogTitleChanged: debounce(function (blogTitle) {
            if (!blogTitle) {
                return;
            }

            this.page.name = blogTitle;
            this.getLocaleLanguage();
            this.generateSlug(blogTitle);
        }, debounceTimeout),

        addBlogError({
            property = null,
            payload = {},
            code = BLOG.REQUIRED_FIELD_ERROR_CODE,
            message = '',
        } = {}) {
            const expression = `sas_blog_entries.${this.blog.id}.${property}`;
            const error = new ShopwareError({
                code,
                detail: message,
                meta: { parameters: payload },
            });

            Shopware.State.commit('error/addApiError', { expression, error });
        },

        getLocaleLanguage() {
            return this.localeRepository.get(Shopware.Context.api.language.localeId, Shopware.Context.api).then((result) => {
                this.localeLanguage = result.code.substr(0, result.code.length - 3).toLowerCase();
                return Promise.resolve(this.localeLanguage);
            });
        },

        generateSlug(value) {
            if (!value) {
                return;
            }

            const slug = slugify(value, { locale: this.localeLanguage, lower: true });

            if (!this.localeLanguage) {
                this.blog.slug = slug;
                return;
            }

            const criteria = new Criteria();
            criteria.addFilter(Criteria.equals('slug', slug));

            this.blogRepository.search(criteria, Shopware.Context.api).then((blogs) => {
                if (this.isCreateMode) {
                    this.blog.slug = this.generateSlugForCreatePage(blogs, slug);
                    return;
                }

                this.blog.slug = this.generateSlugForDetailsPage(blogs, slug, this.slugBlog);
            }).catch((e) => {
                this.blog.slug = slug;
            });
        },

        createPage(name) {
            this.page = this.pageRepository.create();
            this.page.name = name;
            this.page.type = BLOG.CMS_PAGE_TYPE;
            this.pageId = this.page.id;
        },
    },
});
