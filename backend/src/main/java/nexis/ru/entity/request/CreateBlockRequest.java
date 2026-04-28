package nexis.ru.entity.request;

import lombok.Data;
import nexis.ru.entity.BlockType;

@Data
public class CreateBlockRequest {

    Long pageId;
    BlockType type;
    String content;
    int position;

}