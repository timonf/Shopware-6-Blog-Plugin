import { createLocalVue, shallowMount, config } from '@vue/test-utils';
import Vuex from 'vuex';
import 'src/module/sw-cms/state/cms-page.state';
import 'src/module/sw-cms/mixin/sw-cms-state.mixin';
import 'src/module/sw-cms/page/sw-cms-detail';

import 'plugin-admin/src/module/blog-module/page/sas-blog-detail';

function createWrapper(privileges = [], query = { ids: [] }) {
    const localVue = createLocalVue();
    localVue.use(Vuex);
    localVue.directive('tooltip', {});

    return shallowMount(Shopware.Component.build('sas-blog-detail'), {
        localVue,
        stubs: {
            'sw-page': true,
            'sw-cms-toolbar': true,
            'sw-alert': true,
            'sw-language-switch': true,
            'sw-router-link': true,
            'sw-icon': true,
            'router-link': true,
            'sw-button-process': true,
            'sw-cms-stage-add-section': true,
            'sas-cms-sidebar': true,
            'sw-loader': true,
            'sas-cms-section': true,
            'sw-cms-layout-assignment-modal': true,
            'sw-cms-missing-element-modal': true,
        },
        mocks: {
            $route: { params: { id: 'blog-id' }, query },
            $device: {
                getSystemKey: () => 'Strg',
            },
        },
        provide: {
            acl: {
                can: (identifier) => {
                    if (!identifier) {
                        return true;
                    }

                    return privileges.includes(identifier);
                },
            },
            repositoryFactory: {
                create: (entity) => {
                    return {
                        search: () => Promise.resolve([{}]),
                        get: () => {
                            if (entity === 'sas_blog_entries') {
                                return Promise.resolve({
                                    title: 'Blog Title',
                                    slug: 'blog-title',
                                });
                            } else {
                                return Promise.resolve({
                                    sections: [
                                        {}
                                    ]
                                });
                            }
                        },
                        create: jest.fn(() => Promise.resolve()),
                        save: jest.fn(() => Promise.resolve())
                    };
                }
            },
            entityFactory: {},
            entityHydrator: {},
            loginService: {},
            cmsService: {
                getCmsBlockRegistry: () => {
                    return {
                        'product-listing': {},
                    };
                },
            },
            appCmsService: {},
            cmsDataResolverService: {},
        },
    });
}

describe('module/blog-module/page/sas-blog-detail', () => {
    let cmsPageStateBackup;

    beforeAll(() => {
        cmsPageStateBackup = { ...Shopware.State._store.state.cmsPageState };
    });

    beforeEach(() => {
        Shopware.State._store.state.cmsPageState = { ...cmsPageStateBackup };
    });

    it('should be a Vue.js component', async () => {
        const wrapper = createWrapper();

        expect(wrapper.vm).toBeTruthy();
    });

    it('should display page title at the top of the page', async () => {
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        const pageTitle = wrapper.find('.sw-cms-detail__page-name');

        expect(pageTitle.text()).toContain('Blog Title');
    });

});
