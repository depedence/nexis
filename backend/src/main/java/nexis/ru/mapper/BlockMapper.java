package nexis.ru.mapper;

import nexis.ru.entity.Block;
import nexis.ru.entity.dto.BlockDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BlockMapper {

    @Mapping(source = "page.id", target = "pageId")
    BlockDto toDto(Block block);

}