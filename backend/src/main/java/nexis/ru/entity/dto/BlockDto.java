package nexis.ru.entity.dto;

import lombok.Data;
import nexis.ru.entity.BlockType;

import java.time.LocalDateTime;

@Data
public class BlockDto {

    Long id;
    Long pageId;
    BlockType type;
    String content;
    int position;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

}