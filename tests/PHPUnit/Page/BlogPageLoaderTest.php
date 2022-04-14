<?php declare(strict_types=1);

namespace BlogModule\Tests\Page;

use BlogModule\Tests\Fakes\FakeEntityRepository;
use BlogModule\Tests\Traits\ContextTrait;
use PHPUnit\Framework\TestCase;
use Sas\BlogModule\Content\Blog\BlogEntriesDefinition;
use Sas\BlogModule\Content\Blog\BlogEntriesEntity;
use Sas\BlogModule\Page\Blog\BlogPage;
use Sas\BlogModule\Page\Blog\BlogPageLoader;
use Shopware\Core\Content\Cms\CmsPageEntity;
use Shopware\Core\Content\Cms\Exception\PageNotFoundException;
use Shopware\Core\Content\Cms\SalesChannel\SalesChannelCmsPageLoaderInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\Framework\Routing\Exception\MissingRequestParameterException;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\Exception\ConfigurationNotFoundException;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\GenericPageLoaderInterface;
use Shopware\Storefront\Page\Page;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\Request;

class BlogPageLoaderTest extends TestCase
{
    use ContextTrait;

    private SystemConfigService $systemConfigService;

    private GenericPageLoaderInterface $genericLoader;

    private SalesChannelCmsPageLoaderInterface $cmsPageLoader;

    private EntityRepositoryInterface $blogRepository;

    private BlogPageLoader $blogPageLoader;

    private SalesChannelContext $salesChannelContext;

    public function setUp(): void
    {
        $this->systemConfigService = $this->createMock(SystemConfigService::class);
        $this->genericLoader = $this->createMock(GenericPageLoaderInterface::class);
        $this->cmsPageLoader = $this->createMock(SalesChannelCmsPageLoaderInterface::class);
        $this->blogRepository = new FakeEntityRepository(new BlogEntriesDefinition());

        $this->salesChannelContext = $this->getSaleChannelContext($this);

        $this->blogPageLoader = new BlogPageLoader(
            $this->systemConfigService,
            $this->genericLoader,
            $this->createMock(EventDispatcherInterface::class),
            $this->cmsPageLoader,
            $this->blogRepository,
        );
    }

    public function testLoadWithoutId(): void
    {
        $this->expectExceptionObject(new MissingRequestParameterException('articleId', '/articleId'));

        $this->blogPageLoader->load(new Request(), $this->salesChannelContext);
    }

    public function testLoadWithInvalidArticleId(): void
    {
        $articleId = 'bl-100';
        $this->expectExceptionObject(new PageNotFoundException($articleId));
        $this->setUpBlogRepositoryWithoutBlogEntry();

        $request = new Request([], [], [
            'articleId' => $articleId,
        ]);
        $this->blogPageLoader->load($request, $this->salesChannelContext);
    }

    public function testLoadWithoutCmsBlogDetailPageConfig(): void
    {
        $articleId = 'bl-100';
        $detailCmsPageId = null;
        $this->expectExceptionObject(new ConfigurationNotFoundException('SasBlogModule'));
        $this->setUpBlogRepositoryWithBlogEntry($articleId);

        $this->systemConfigService->method('get')->willReturn($detailCmsPageId);

        $request = new Request([], [], [
            'articleId' => $articleId,
        ]);
        $this->blogPageLoader->load($request, $this->salesChannelContext);
    }

    public function testLoadWithoutCmsPage(): void
    {
        $articleId = 'bl-100';
        $detailCmsPageId = 'cms-111';
        $this->expectExceptionObject(new PageNotFoundException($detailCmsPageId));
        $this->setUpBlogRepositoryWithBlogEntry($articleId);

        $searchResults = $this->getCmsPageLoaderResult();
        $this->systemConfigService->method('get')->willReturn($detailCmsPageId);
        $this->cmsPageLoader->method('load')->willReturn($searchResults);

        $request = new Request([], [], [
            'articleId' => $articleId,
        ]);
        $this->blogPageLoader->load($request, $this->salesChannelContext);
    }

    public function testLoad(): void
    {
        $articleId = 'bl-100';
        $detailCmsPageId = 'cms-111';
        $this->setUpBlogRepositoryWithBlogEntry($articleId);

        $searchResults = $this->getCmsPageLoaderResult($detailCmsPageId);
        $this->systemConfigService->method('get')->willReturn($detailCmsPageId);
        $this->cmsPageLoader->method('load')->willReturn($searchResults);
        $this->genericLoader->method('load')->willReturn($this->createMock(Page::class));

        $request = new Request([], [], [
            'articleId' => $articleId,
        ]);
        $actualResult = $this->blogPageLoader->load($request, $this->salesChannelContext);

        $this->assertInstanceOf(BlogPage::class, $actualResult);
        $this->assertSame($detailCmsPageId, $actualResult->getCmsPage()->getId());
    }

    private function setUpBlogRepositoryWithBlogEntry(string $articleId)
    {
        $searchResults = $this->createConfiguredMock(EntitySearchResult::class, [
            'first' => $this->createConfiguredMock(BlogEntriesEntity::class, [
                'getId' => $articleId,
            ])
        ]);

        $this->blogRepository->entitySearchResults = [$searchResults];
    }

    private function setUpBlogRepositoryWithoutBlogEntry()
    {
        $searchResults = $this->createConfiguredMock(EntitySearchResult::class, []);

        $this->blogRepository->entitySearchResults = [$searchResults];
    }

    private function getCmsPageLoaderResult(?string $cmsPageId = null)
    {
        if (!$cmsPageId) {
            return $this->createConfiguredMock(EntitySearchResult::class, []);
        }

        return $this->createConfiguredMock(EntitySearchResult::class, [
            'first' => $this->createConfiguredMock(CmsPageEntity::class, [
                'getId' => $cmsPageId,
            ])
        ]);
    }
}
