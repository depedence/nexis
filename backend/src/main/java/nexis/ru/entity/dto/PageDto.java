package nexis.ru.entity.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PageDto {

    Long id;
    Long parentId;
    String title;
    String content;
    int position;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

}