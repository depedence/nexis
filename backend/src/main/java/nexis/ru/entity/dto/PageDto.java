package nexis.ru.entity.dto;

import lombok.Data;
import nexis.ru.entity.PageType;

import java.time.LocalDateTime;

@Data
public class PageDto {

    Long id;
    Long parentId;
    String title;
    String content;
    PageType type;
    int position;
    boolean favorite;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

}
