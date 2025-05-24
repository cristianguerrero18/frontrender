import { 
    obtenerUsuarios, 
    crearUsuario, 
    eliminarUsuario, 
    editarUsuario 
  } from "../apiConnection/consumeUsuarios.js";
  
  document.addEventListener("DOMContentLoaded", () => {
      getUsuarios();
  });
  
  document.addEventListener('DOMContentLoaded', function() {
      const formAgregarUsuario = document.getElementById("form-agregar-usuario");
      const enviarFormulariousuarioBtn = document.getElementById("enviarFormulario-usuario");
  
      enviarFormulariousuarioBtn.addEventListener("click", () => {
          formAgregarUsuario.dispatchEvent(new Event('submit')); 
      });
  
      formAgregarUsuario.addEventListener("submit", async (e) => {
          e.preventDefault();
  
          const nombre = document.getElementById("nombre").value;
          const email = document.getElementById("email").value;
          const password = document.getElementById("password").value;
          const direccion = document.getElementById("direccion").value;
          const tipo = document.getElementById("tipo_usuario").value;
          const telefono = parseInt(document.getElementById("telefono").value);
          const cedula = parseInt(document.getElementById("cedula").value);
          const fecha_registro = new Date().toISOString(); // Cambio para MongoDB (fecha completa)
  
          if (!nombre || !email || !password || !direccion || isNaN(telefono) || !tipo || isNaN(cedula)) {
              alert("Por favor, complete todos los campos correctamente.");
              return;
          }
  
          const nuevoUsuario = {
              nombre,
              email,
              password,
              direccion,
              telefono,
              tipo,
              cedula,
              fecha_registro // MongoDB maneja fechas completas
          };
  
          try {
              const respuesta = await crearUsuario(nuevoUsuario); 
  
              if (respuesta && respuesta._id) { // MongoDB usa _id
                  alert("Usuario agregado correctamente");
                  formAgregarUsuario.reset();
                  document.querySelector("#usuarios-body").innerHTML = "";
                  getUsuarios(); 
              } else {
                  alert("Error al agregar el usuario."); 
              }
          } catch (error) {
              console.error("Error:", error);
              alert("Ocurrió un error inesperado: " + error.message); 
          }
      });
  });
  
  async function getUsuarios() {
      try {
          const usuariosObtained = await obtenerUsuarios();
          const container = document.querySelector('#usuarios-body');
          container.innerHTML = ''; // Limpiar el contenedor antes de agregar
          
          usuariosObtained.forEach((usuario) => {
              const {
                  _id, nombre, email, password, direccion, telefono, tipo, fecha_registro, cedula
              } = usuario;
              
              // Formatear fecha para mostrarla mejor
              const fechaFormateada = new Date(fecha_registro).toLocaleDateString();
              
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${_id}</td> <!-- MongoDB usa _id -->
                  <td>${cedula}</td>
                  <td>${nombre}</td>
                  <td>${email}</td>
                  <td>${tipo}</td>
                  <td>${fechaFormateada}</td>
                  <td>
                      <button class="btn color3 usuario-details-btn"
                          data-id="${_id}"
                          data-nombre="${nombre}"
                          data-email="${email}"
                          data-password="${password}"
                          data-direccion="${direccion}"
                          data-telefono="${telefono}"
                          data-tipo="${tipo}"
                          data-fecha_registro="${fecha_registro}"
                          data-cedula="${cedula}">
                          Detalles Usuario
                      </button>
                  </td>
                  <td>
                      <button class="btn color2 edit-btn" 
                          data-id="${_id}"
                          data-nombre="${nombre}"
                          data-email="${email}"
                          data-password="${password}"
                          data-direccion="${direccion}"
                          data-telefono="${telefono}"
                          data-tipo="${tipo}"
                          data-fecha_registro="${fecha_registro}"
                          data-cedula="${cedula}">
                          Edit
                      </button>
                  </td>
                  <td><button class="btn color5 delete-btn" data-id="${_id}">Delete</button></td>
              `;
              container.appendChild(row);
          });
  
          // Agregar event listeners
          document.querySelectorAll('.usuario-details-btn').forEach(button => {
              button.addEventListener('click', showUsuarioDetails);
          });
          
          document.querySelectorAll(".delete-btn").forEach((button) => {
              button.addEventListener("click", handleDelete);
          });
          
          // Agregar event listener para los botones de edición
          document.querySelectorAll(".edit-btn").forEach((button) => {
              button.addEventListener("click", handleEdit);
          });
      } catch (error) {
          console.error("Error al obtener usuarios:", error);
          alert("Error al cargar los usuarios: " + error.message);
      }
  }
  
  function handleEdit(event) {
      const button = event.currentTarget;
      
      // Crear modal de edición
      let modal = document.getElementById('edit-usuario-modal');
      if (!modal) {
          modal = document.createElement('div');
          modal.id = 'edit-usuario-modal';
          modal.className = 'modal';
          document.body.appendChild(modal);
  
          // Estilos del modal
          modal.style.position = 'fixed';
          modal.style.top = '50%';
          modal.style.left = '50%';
          modal.style.transform = 'translate(-50%, -50%)';
          modal.style.backgroundColor = 'white';
          modal.style.padding = '20px';
          modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
          modal.style.zIndex = '1000';
          modal.style.borderRadius = '8px';
          modal.style.maxWidth = '500px';
          modal.style.width = '90%';
      }
  
      // Obtener datos del usuario
      const id = button.getAttribute('data-id');
      const nombre = button.getAttribute('data-nombre');
      const email = button.getAttribute('data-email');
      const password = button.getAttribute('data-password');
      const direccion = button.getAttribute('data-direccion');
      const telefono = button.getAttribute('data-telefono');
      const tipo = button.getAttribute('data-tipo');
      const cedula = button.getAttribute('data-cedula');
  
      // Contenido del modal de edición
      modal.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <h3 style="margin: 0;">Editar Usuario</h3>
              <button id="close-edit-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
          </div>
          <form id="edit-usuario-form">
              <input type="hidden" id="edit-id" value="${id}">
              <div style="margin-bottom: 15px;">
                  <label for="edit-nombre" style="display: block; margin-bottom: 5px;">Nombre:</label>
                  <input type="text" id="edit-nombre" value="${nombre}" style="width: 100%; padding: 8px; box-sizing: border-box;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="edit-email" style="display: block; margin-bottom: 5px;">Email:</label>
                  <input type="email" id="edit-email" value="${email}" style="width: 100%; padding: 8px; box-sizing: border-box;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="edit-password" style="display: block; margin-bottom: 5px;">Password:</label>
                  <input type="password" id="edit-password" value="${password}" style="width: 100%; padding: 8px; box-sizing: border-box;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="edit-direccion" style="display: block; margin-bottom: 5px;">Dirección:</label>
                  <input type="text" id="edit-direccion" value="${direccion}" style="width: 100%; padding: 8px; box-sizing: border-box;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="edit-telefono" style="display: block; margin-bottom: 5px;">Teléfono:</label>
                  <input type="number" id="edit-telefono" value="${telefono}" style="width: 100%; padding: 8px; box-sizing: border-box;">
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="edit-tipo" style="display: block; margin-bottom: 5px;">Tipo:</label>
                  <select id="edit-tipo" style="width: 100%; padding: 8px; box-sizing: border-box;">
                      <option value="admin" ${tipo === 'admin' ? 'selected' : ''}>Admin</option>
                      <option value="cliente" ${tipo === 'cliente' ? 'selected' : ''}>Cliente</option>
                  </select>
              </div>
              <div style="margin-bottom: 15px;">
                  <label for="edit-cedula" style="display: block; margin-bottom: 5px;">Cédula:</label>
                  <input type="number" id="edit-cedula" value="${cedula}" style="width: 100%; padding: 8px; box-sizing: border-box;">
              </div>
              <button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Guardar Cambios</button>
          </form>
      `;
  
      modal.style.display = 'block';
  
      // Cerrar modal
      document.getElementById('close-edit-modal').addEventListener('click', () => {
          modal.style.display = 'none';
      });
  
      // Manejar envío del formulario
      document.getElementById('edit-usuario-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const usuarioActualizado = {
              nombre: document.getElementById('edit-nombre').value,
              email: document.getElementById('edit-email').value,
              password: document.getElementById('edit-password').value,
              direccion: document.getElementById('edit-direccion').value,
              telefono: parseInt(document.getElementById('edit-telefono').value),
              tipo: document.getElementById('edit-tipo').value,
              cedula: parseInt(document.getElementById('edit-cedula').value)
          };
  
          try {
              const respuesta = await editarUsuario(
                  document.getElementById('edit-id').value, 
                  usuarioActualizado
              );
              
              if (respuesta && respuesta._id) { // Verificar por _id en MongoDB
                  alert("Usuario actualizado correctamente");
                  modal.style.display = 'none';
                  document.querySelector("#usuarios-body").innerHTML = "";
                  getUsuarios();
              } else {
                  throw new Error("No se pudo actualizar el usuario");
              }
          } catch (error) {
              console.error("Error al actualizar usuario:", error);
              alert("Error al actualizar usuario: " + error.message);
          }
      });
  
      // Cerrar al hacer clic fuera del modal
      window.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.style.display = 'none';
          }
      });
  }
  
  function showUsuarioDetails(event) {
      const button = event.currentTarget;
  
      const id = button.getAttribute('data-id');
      const nombre = button.getAttribute('data-nombre');
      const email = button.getAttribute('data-email');
      const password = button.getAttribute('data-password');
      const direccion = button.getAttribute('data-direccion');
      const telefono = button.getAttribute('data-telefono');
      const tipo = button.getAttribute('data-tipo');
      const fecha_registro = button.getAttribute('data-fecha_registro');
      const cedula = button.getAttribute('data-cedula');
  
      // Formatear fecha para mostrarla mejor
      const fechaFormateada = new Date(fecha_registro).toLocaleString();
  
      let modal = document.getElementById('usuario-details-modal');
      if (!modal) {
          modal = document.createElement('div');
          modal.id = 'usuario-details-modal';
          modal.className = 'modal';
          document.body.appendChild(modal);
  
          modal.style.position = 'fixed';
          modal.style.top = '50%';
          modal.style.left = '50%';
          modal.style.transform = 'translate(-50%, -50%)';
          modal.style.backgroundColor = 'white';
          modal.style.padding = '20px';
          modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
          modal.style.zIndex = '1000';
          modal.style.borderRadius = '8px';
          modal.style.maxWidth = '600px';
          modal.style.width = '90%';
      }
  
      modal.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <h3 style="margin: 0;">Detalles del Usuario</h3>
              <button id="close-usuario-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Campo</th><th style="text-align:left; padding:6px; border-bottom:1px solid #ccc;">Valor</th></tr>
              <tr><td style="padding:6px;">ID</td><td style="padding:6px;">${id}</td></tr>
              <tr><td style="padding:6px;">Nombre</td><td style="padding:6px;">${nombre}</td></tr>
              <tr><td style="padding:6px;">Email</td><td style="padding:6px;">${email}</td></tr>
              <tr><td style="padding:6px;">Password</td><td style="padding:6px;">${password}</td></tr>
              <tr><td style="padding:6px;">Dirección</td><td style="padding:6px;">${direccion}</td></tr>
              <tr><td style="padding:6px;">Teléfono</td><td style="padding:6px;">${telefono}</td></tr>
              <tr><td style="padding:6px;">Tipo</td><td style="padding:6px;">${tipo}</td></tr>
              <tr><td style="padding:6px;">Fecha de Registro</td><td style="padding:6px;">${fechaFormateada}</td></tr>
              <tr><td style="padding:6px;">Cédula</td><td style="padding:6px;">${cedula}</td></tr>
          </table>
      `;
  
      modal.style.display = 'block';
  
      document.getElementById('close-usuario-modal').addEventListener('click', () => {
          modal.style.display = 'none';
      });
  
      window.addEventListener('click', (e) => {
          if (e.target === modal) {
              modal.style.display = 'none';
          }
      });
  }
  
  async function handleDelete(event) {
      const button = event.currentTarget;
      const id = button.getAttribute("data-id");
  
      if (!id) {
          alert("ID de usuario no válido");
          return;
      }
  
      if (confirm("¿Está seguro que desea eliminar este usuario?")) {
          try {
              const respuesta = await eliminarUsuario(id);
  
              if (respuesta && (respuesta.message || respuesta.deletedCount > 0)) {
                  alert(respuesta.message || "Usuario eliminado correctamente");
                  document.querySelector("#usuarios-body").innerHTML = "";
                  getUsuarios();
              } else {
                  alert("No se pudo eliminar el usuario");
              }
          } catch (error) {
              console.error("Error:", error);
              alert("Ocurrió un error al eliminar el usuario: " + error.message);
          }
      }
  }