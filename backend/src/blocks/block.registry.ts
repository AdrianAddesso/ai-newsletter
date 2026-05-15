import { BlockDefinition } from './block.definition';
import { Example1Block } from './definitions/example1.block';
import { Example2Block } from './definitions/example2.block';

export class BlockRegistry {
    private static instance: BlockRegistry;
    private readonly blocks = new Map<string, BlockDefinition>();

    private constructor() {
        // Se registran todos los tipos disponibles al iniciar
        const definitions: BlockDefinition[] = [
        new Example1Block(),
        new Example2Block(),
        // ...
        ];
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