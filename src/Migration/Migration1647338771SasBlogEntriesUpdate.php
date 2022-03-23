<?php declare(strict_types=1);

namespace Sas\BlogModule\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1647338771SasBlogEntriesUpdate extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1647338771;
    }

    public function update(Connection $connection): void
    {
        $connection->executeUpdate('
            ALTER TABLE `sas_blog_entries`
            ADD `cms_page_id` BINARY(16) NULL AFTER `id`,
            ADD `cms_page_version_id` binary(16) NULL AFTER `cms_page_id`,

            ADD CONSTRAINT `fk.sas_blog_entries.cms_page_id`
                FOREIGN KEY (`cms_page_id`, `cms_page_version_id`)
                REFERENCES `cms_page` (`id`, `version_id`)
                ON DELETE RESTRICT ON UPDATE CASCADE;
        ');
    }

    public function updateDestructive(Connection $connection): void
    {
        // implement update destructive
    }
}
