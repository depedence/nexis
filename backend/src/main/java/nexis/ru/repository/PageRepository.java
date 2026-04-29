package nexis.ru.repository;

import nexis.ru.entity.Page;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PageRepository extends JpaRepository<Page, Long> {

    List<Page> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
        String title,
        String content
    );

    List<Page> findByParentIdIsNullOrderByPositionAsc();

    List<Page> findByParentIdOrderByPositionAsc(Long parentId);

}
