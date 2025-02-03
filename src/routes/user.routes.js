const express = require('express');
const router = express.Router();
const { authMiddleware, checkUserType } = require('../middleware/auth.middleware');

// Protege todas as rotas com autenticação
router.use(authMiddleware);

// Rota para obter perfil do usuário
router.get('/profile', async (req, res) => {
  try {
    // O usuário e perfil já estão disponíveis através do middleware
    const { user, profile } = req;

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      },
      profile
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Rota para atualizar perfil
router.put('/profile', async (req, res) => {
  try {
    const { user, profile } = req;
    const { nome, ...profileData } = req.body;

    // Atualizar dados do usuário
    if (nome) {
      await user.update({ nome });
    }

    // Atualizar dados específicos do perfil
    if (profile) {
      switch (user.tipo) {
        case 'cliente':
          if (profileData.endereco || profileData.telefone) {
            await profile.update({
              endereco: profileData.endereco || profile.endereco,
              telefone: profileData.telefone || profile.telefone
            });
          }
          break;
        case 'fornecedor':
          if (profileData.nome_estabelecimento || profileData.localizacao || profileData.especialidade) {
            await profile.update({
              nome: profileData.nome_estabelecimento || profile.nome,
              localizacao: profileData.localizacao || profile.localizacao,
              especialidade: profileData.especialidade || profile.especialidade
            });
          }
          break;
        case 'entregador':
          if (profileData.veiculo) {
            await profile.update({
              veiculo: profileData.veiculo
            });
          }
          break;
      }
    }

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      },
      profile
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

module.exports = router;