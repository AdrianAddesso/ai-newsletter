import { BadRequestException } from "@nestjs/common/exceptions/bad-request.exception";

type layoutDTO = {
    block_type: string | null;
    content: string | null;
    row: number;
    grid_column: number;
    display_order: number;
    mustFill?: boolean | undefined;
};

export const validateTemplateBlocks = (block: layoutDTO, blockRegistry: any) => {
    if (block.block_type === null) {
        return {
            type: null,
            content: null,
            row: block.row,
            grid_column: block.grid_column,
            display_order: block.display_order ?? 0,
            mustFill: false,
        };
    }

    const blockDefinition = blockRegistry.getByType(block.block_type);

    if (!blockDefinition) {
        throw new BadRequestException({
            message: `Tipo de bloque inválido: ${block.block_type}`,
        });
    }

    return {
        type: block.block_type,
        content: block.content,
        row: block.row,
        grid_column: block.grid_column,
        display_order: block.display_order ?? 0,
        mustFill: block.mustFill ?? false,
    };
};