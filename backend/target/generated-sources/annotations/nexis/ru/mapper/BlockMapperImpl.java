package nexis.ru.mapper;

import javax.annotation.processing.Generated;
import nexis.ru.entity.Block;
import nexis.ru.entity.Page;
import nexis.ru.entity.dto.BlockDto;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-28T11:28:58+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.16 (Microsoft)"
)
@Component
public class BlockMapperImpl implements BlockMapper {

    @Override
    public BlockDto toDto(Block block) {
        if ( block == null ) {
            return null;
        }

        BlockDto blockDto = new BlockDto();

        blockDto.setPageId( blockPageId( block ) );
        blockDto.setId( block.getId() );
        blockDto.setType( block.getType() );
        blockDto.setContent( block.getContent() );
        blockDto.setPosition( block.getPosition() );
        blockDto.setCreatedAt( block.getCreatedAt() );
        blockDto.setUpdatedAt( block.getUpdatedAt() );

        return blockDto;
    }

    private Long blockPageId(Block block) {
        if ( block == null ) {
            return null;
        }
        Page page = block.getPage();
        if ( page == null ) {
            return null;
        }
        Long id = page.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
