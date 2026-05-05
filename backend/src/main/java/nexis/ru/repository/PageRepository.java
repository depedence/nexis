package nexis.ru.repository;

import nexis.ru.entity.Page;
import nexis.ru.entity.PageType;
import nexis.ru.entity.User;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PageRepository extends JpaRepository<Page, Long> {

    @Query("""
        select p from Page p
        where p.user = :user
        and (
            lower(p.title) like lower(concat('%', :query, '%'))
            or lower(p.content) like lower(concat('%', :query, '%'))
        )
    """)
    List<Page> search(@Param("user") User user, @Param("query") String query);

    List<Page> findByParentIdIsNullOrderByPositionAsc(User user);

    List<Page> findByParentIdOrderByPositionAsc(Long parentId, User user);

    List<Page> findByTypeAndFavoriteTrueOrderByUpdatedAtDesc(PageType type, User user);

    Optional<Page> findByIdAndUser(Long id, User user);

    List<Page> findByUser(User user);

    void deleteAllByParentIdAndUser(Long parentId, User user);

}
