import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Função de diagnóstico para verificar acesso à coleção companies
 */
export const debugCompanies = async () => {
  try {
    console.log('=== DIAGNÓSTICO DE EMPRESAS ===');
    
    // Verifica se o db está inicializado
    if (!db) {
      console.error('❌ Firestore não está inicializado');
      return;
    }
    console.log('✅ Firestore inicializado');

    // Tenta buscar empresas diretamente
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef);
    
    console.log('🔍 Buscando empresas...');
    const snapshot = await getDocs(q);
    
    console.log(`📊 Total de documentos encontrados: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.warn('⚠️ Nenhuma empresa encontrada na coleção "companies"');
      console.log('💡 Verifique:');
      console.log('   1. Se as empresas existem no Firestore Console');
      console.log('   2. Se as regras de segurança permitem leitura');
      console.log('   3. Se você está autenticado');
    } else {
      console.log('✅ Empresas encontradas:');
      snapshot.docs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ID: ${doc.id}`, doc.data());
      });
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Código:', (error as any).code);
      console.error('   Stack:', error.stack);
    }
    throw error;
  }
};
