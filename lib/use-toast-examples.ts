/**
 * Toast notification usage examples
 * 
 * Import: import { useToast } from '@/components/ui/toast'
 * 
 * In component:
 * const toast = useToast()
 * 
 * Examples:
 */

// ===== SUCCESS =====
// toast.success('Uitgave toegevoegd', 'Je uitgave is succesvol opgeslagen')
// toast.success('Rapport gegenereerd')

// ===== ERROR =====
// toast.error('Kon uitgave niet opslaan', 'Probeer het opnieuw')
// toast.error('Upload mislukt', 'Bestand te groot (max 10MB)')

// ===== WARNING =====
// toast.warning('Geen bonnen gevonden', 'Upload een nieuwe bon')
// toast.warning('Sessie verloopt binnenkort')

// ===== INFO =====
// toast.info('Nieuwe functie beschikbaar', 'Probeer onze batch upload!')
// toast.info('Rapport wordt gegenereerd...')

// ===== CUSTOM =====
// toast.addToast({
//   type: 'success',
//   title: 'Custom titel',
//   description: 'Custom beschrijving'
// })

// ===== REAL USAGE EXAMPLES =====

// In receipt upload component:
// try {
//   const result = await uploadReceipt(file)
//   if (result.success) {
//     toast.success('Bon gescand', 'Gegevens automatisch ingevuld')
//   } else {
//     toast.error('Scan mislukt', result.error)
//   }
// } catch (error) {
//   toast.error('Upload fout', 'Probeer het opnieuw')
// }

// In expense form:
// const handleSubmit = async (data) => {
//   try {
//     await createExpense(data)
//     toast.success('Uitgave opgeslagen')
//     router.push('/expenses')
//   } catch (error) {
//     toast.error('Kon uitgave niet opslaan', error.message)
//   }
// }

// In report generation:
// const generateReport = async () => {
//   toast.info('Rapport wordt gegenereerd...')
//   try {
//     const report = await createReport(year, quarter)
//     toast.success('Rapport klaar', 'Download je PDF')
//   } catch (error) {
//     toast.error('Generatie mislukt', error.message)
//   }
// }

// Delete confirmation:
// const handleDelete = async (id) => {
//   try {
//     await deleteExpense(id)
//     toast.success('Uitgave verwijderd')
//   } catch (error) {
//     toast.error('Kon niet verwijderen')
//   }
// }

export {}
