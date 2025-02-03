'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Criar enum types
    await queryInterface.sequelize.query(`
      CREATE TYPE tipo_usuario AS ENUM ('cliente', 'fornecedor', 'entregador', 'admin', 'atendimento');
      CREATE TYPE status_pedido AS ENUM ('pendente', 'aceito', 'preparando', 'pronto', 'entregando', 'entregue', 'cancelado');
    `);

    // Criar tabela usuarios
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      senha: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tipo: {
        type: Sequelize.ENUM('cliente', 'fornecedor', 'entregador', 'admin', 'atendimento'),
        allowNull: false
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela fornecedores
    await queryInterface.createTable('fornecedores', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false
      },
      localizacao: {
        type: Sequelize.STRING,
        allowNull: false
      },
      especialidade: {
        type: Sequelize.STRING,
        allowNull: false
      },
      disponivel: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela entregadores
    await queryInterface.createTable('entregadores', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      veiculo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      disponivel: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela clientes
    await queryInterface.createTable('clientes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      endereco: {
        type: Sequelize.STRING,
        allowNull: false
      },
      telefone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela pratos
    await queryInterface.createTable('pratos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      fornecedor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fornecedores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      preco: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      disponivel: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela pedidos
    await queryInterface.createTable('pedidos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      cliente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fornecedor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'fornecedores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      entregador_id: {
        type: Sequelize.UUID,
        references: {
          model: 'entregadores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pendente', 'aceito', 'preparando', 'pronto', 'entregando', 'entregue', 'cancelado'),
        defaultValue: 'pendente'
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela itens_pedido
    await queryInterface.createTable('itens_pedido', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      pedido_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pedidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      prato_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pratos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar tabela mensagens
    await queryInterface.createTable('mensagens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      remetente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      destinatario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      conteudo: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover tabelas na ordem inversa da criação
    await queryInterface.dropTable('mensagens');
    await queryInterface.dropTable('itens_pedido');
    await queryInterface.dropTable('pedidos');
    await queryInterface.dropTable('pratos');
    await queryInterface.dropTable('clientes');
    await queryInterface.dropTable('entregadores');
    await queryInterface.dropTable('fornecedores');
    await queryInterface.dropTable('usuarios');

    // Remover tipos enum
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS status_pedido;
      DROP TYPE IF EXISTS tipo_usuario;
    `);
  }
};