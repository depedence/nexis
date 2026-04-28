package nexis.ru.entity.request;

import lombok.Data;
import nexis.ru.entity.BlockType;

@Data
public class UpdateBlockRequest {

    BlockType type;
    String content;

}