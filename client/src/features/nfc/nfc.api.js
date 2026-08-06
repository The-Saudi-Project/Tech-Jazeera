/**
 * NFC Customers API layer — the only file that knows the endpoint URLs.
 * Each call returns the `data` from our standard { success, message, data }.
 */
import { api } from '../../lib/axios.js';

export async function listNfcCompanies(params) {
  const { data } = await api.get('/nfc/companies', { params });
  return data.data; // companies[] with employeeCount
}

export async function getNfcCompany(id) {
  const { data } = await api.get(`/nfc/companies/${id}`);
  return data.data; // company + employees[]
}

export async function createNfcCompany(payload) {
  const { data } = await api.post('/nfc/companies', payload);
  return data.data;
}

export async function updateNfcCompany(id, payload) {
  const { data } = await api.patch(`/nfc/companies/${id}`, payload);
  return data.data;
}

export async function deleteNfcCompany(id) {
  await api.delete(`/nfc/companies/${id}`);
}

export async function createNfcEmployee(payload) {
  const { data } = await api.post('/nfc/employees', payload);
  return data.data;
}

export async function updateNfcEmployee(id, payload) {
  const { data } = await api.patch(`/nfc/employees/${id}`, payload);
  return data.data;
}

export async function deleteNfcEmployee(id) {
  await api.delete(`/nfc/employees/${id}`);
}
