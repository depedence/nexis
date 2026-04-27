package nexis.ru.entity.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PageDto {

    Long id;
    Long parentId;
    String title;
    int position;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

}