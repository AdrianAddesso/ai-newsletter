import { BlockDefinition } from './block.definition';
import * as AllBlocks from './definitions/index';

export class BlockRegistry {
    private static instance: BlockRegistry;
    private readonly blocks = new Map<string, BlockDefinition>();

    private constructor() {
        // Se registran todos los tipos disponibles al iniciar
        const definitions: BlockDefinition[] = Object.values(AllBlocks).map(
        (BlockClass) => new BlockClass(),
        );
        definitions.forEach((b) => this.blocks.set(b.type, b));
    }

    static getInstance(): BlockRegistry {
        if (!BlockRegistry.instance) {
        BlockRegistry.instance = new BlockRegistry();
        }
        return BlockRegistry.instance;
    }

    getAll(): BlockDefinition[] {
        return [...this.blocks.values()];
    }

    getByType(type: string): BlockDefinition | undefined {
        return this.blocks.get(type);
    }
}