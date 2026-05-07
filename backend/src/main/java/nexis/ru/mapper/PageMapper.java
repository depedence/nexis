package nexis.ru.mapper;

import nexis.ru.entity.Page;
import nexis.ru.entity.dto.PageDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PageMapper {

    PageDto toDto(Page page);

    @Mapping(target = "user", ignore = true)
    Page toEntity(PageDto pageDto);

}
